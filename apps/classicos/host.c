/* PocketJS host: input, frame pacing and LCD updates around the Rust core
 * (pocketjs/hosts/rockbox/src/lib.rs). Ported from the Rockbox plugin host
 * in pocketjs/hosts/rockbox/plugin/pocketjs.c, minus the plugin API. */

#include "config.h"
#include <stdio.h>
#include <string.h>
#include "system.h"
#include "kernel.h"
#include "lcd.h"
#include "font.h"
#include "button.h"
#include "file.h"
#include "panic.h"
#include "usb.h"
#include "powermgmt.h"
#include "host.h"

#define DATA_DIR ROCKBOX_DIR "/classicos"

#define BUSY_PERIOD 3 /* ticks; the app clock runs at 33 Hz */
#define IDLE_PERIOD (HZ / 10)
#define IDLE_AFTER HZ
#define POWEROFF_HOLD (HZ * 3 / 2)

/* Button bits, shared with lib.rs */
#define PJ_UP     1
#define PJ_DOWN   2
#define PJ_SELECT 4
#define PJ_MENU   8
#define PJ_LEFT   16
#define PJ_RIGHT  32
#define PJ_PLAY   64

int pocketjs_init(void *heap, size_t heap_len, int w, int h);
int pocketjs_frame(fb_data *fb, int w, int h, unsigned buttons, int wheel,
                   int (*rects)[4]);
void pocketjs_invalidate(void);

/* static heap; carve it from buflib next to the audio buffer once
 * playback is linked (M3). The plugin host peaked around 255 KB. */
static unsigned char heap[2 * 1024 * 1024] __attribute__((aligned(8)));

uint32_t pocketjs_host_usec(void)
{
#ifdef USEC_TIMER
    return USEC_TIMER;
#else
    return current_tick * (1000000 / HZ);
#endif
}

int pocketjs_host_read(const char *path, unsigned char *buf, int max)
{
    char full[MAX_PATH];
    int fd, n;

    snprintf(full, sizeof(full), DATA_DIR "/%s", path);
    fd = open(full, O_RDONLY);
    if (fd < 0)
        return -1;
    n = buf ? read(fd, buf, max) : (int)lseek(fd, 0, SEEK_END);
    close(fd);
    return n;
}

void pocketjs_host_panic(const char *msg) NORETURN_ATTR;
void pocketjs_host_panic(const char *msg)
{
    panicf("PocketJS: %s", msg);
}

static unsigned map_button(long b)
{
    unsigned bits = 0;
    if (b & BUTTON_SCROLL_BACK) bits |= PJ_UP;
    if (b & BUTTON_SCROLL_FWD)  bits |= PJ_DOWN;
    if (b & BUTTON_SELECT)      bits |= PJ_SELECT;
    if (b & BUTTON_MENU)        bits |= PJ_MENU;
    if (b & BUTTON_LEFT)        bits |= PJ_LEFT;
    if (b & BUTTON_RIGHT)       bits |= PJ_RIGHT;
    if (b & BUTTON_PLAY)        bits |= PJ_PLAY;
    return bits;
}

static void set_boost(bool *boosted, bool on)
{
#ifdef HAVE_ADJUSTABLE_CPU_FREQ
    if (*boosted != on)
        cpu_boost(on);
#endif
    *boosted = on;
}

static void usb_mode(void)
{
    lcd_clear_display();
    lcd_putsxy(8, 8, "USB connected");
    lcd_update();
    usb_acknowledge(SYS_USB_CONNECTED_ACK, button_get_data());
    while (button_get(true) != SYS_USB_DISCONNECTED)
        ;
    pocketjs_invalidate();
}

void classicos_host_run(void)
{
    fb_data *fb = lcd_set_viewport(NULL)->buffer->fb_ptr;
    int rects[8][4], count, ret;
    long b = BUTTON_NONE, now, left, frame_start, last_active, play_down = 0;
    bool boosted = false;

    lcd_set_foreground(LCD_WHITE);
    lcd_set_background(LCD_BLACK);
    lcd_setfont(FONT_SYSFIXED);

    set_boost(&boosted, true);
    ret = pocketjs_init(heap, sizeof(heap), LCD_WIDTH, LCD_HEIGHT);
    if (ret != 0)
        panicf(ret == -2 ? "PocketJS: font or image missing in " DATA_DIR
                         : "PocketJS: init failed (%d)", ret);
    last_active = current_tick;

    for (;;) {
        unsigned held = map_button(button_status()) & ~(PJ_UP | PJ_DOWN);
        int wheel = 0;

        frame_start = current_tick;
        /* Wheel steps are summed per frame and delivered as a relative axis. */
        if (b == BUTTON_NONE)
            b = button_get(false);
        for (; b != BUTTON_NONE; b = button_get(false)) {
            if (b == SYS_USB_CONNECTED)
                usb_mode();
            else if (b == SYS_POWEROFF)
                shutdown_hw(SHUTDOWN_POWER_OFF);
            else if (b == BUTTON_PLAY)
                play_down = frame_start;
            else if (!(b & (SYS_EVENT | BUTTON_REL))) {
                if (b & BUTTON_SCROLL_FWD)
                    wheel++;
                else if (b & BUTTON_SCROLL_BACK)
                    wheel--;
            }
        }

        /* hold Play = power off until Control Center exists */
        if ((held & PJ_PLAY) && play_down &&
            TIME_AFTER(frame_start, play_down + POWEROFF_HOLD)) {
            play_down = 0;
            sys_poweroff();
        }

        if (held || wheel) {
            set_boost(&boosted, true);
            last_active = frame_start;
        }
        count = pocketjs_frame(fb, LCD_WIDTH, LCD_HEIGHT, held, wheel, rects);
        for (int i = 0; i < count; i++)
            lcd_update_rect(rects[i][0], rects[i][1], rects[i][2], rects[i][3]);
        if (count) {
            set_boost(&boosted, true);
            last_active = frame_start;
        }

        now = current_tick;
        if (boosted && TIME_AFTER(now, last_active + IDLE_AFTER))
            set_boost(&boosted, false);
        left = frame_start + (boosted ? BUSY_PERIOD : IDLE_PERIOD) - now;
        b = left > 0 ? button_get_w_tmo(left) : BUTTON_NONE;
    }
}
