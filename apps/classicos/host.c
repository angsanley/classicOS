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
#include "media.h"
#include "core_alloc.h"
#include "settings_classicos.h"
#ifdef HAVE_HARDWARE_CLICK
#include "piezo.h"
#endif

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
void pocketjs_timings(uint32_t *out);

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

#ifdef PJS_HUD
/* make PJS_HUD=1: bottom strip with
 * fps, B(oosted)/i(dle), model/draw/raster/lcd ms, repainted %, UI stack, free RAM */
#define HUD_H 10

struct perf {
    unsigned frames;
    unsigned long phase[4]; /* µs: model, draw, raster, LCD */
    unsigned long area, stack;
    long since;
};

static void average(unsigned long *acc, unsigned long sample)
{
    *acc = *acc ? (*acc * 7 + sample) / 8 : sample;
}

static unsigned long stack_used(void)
{
#if (CONFIG_PLATFORM & PLATFORM_NATIVE)
    const uint32_t *w = (const uint32_t *)ui_stack;
    size_t i, n = UI_STACK_SIZE / 4;
    for (i = 0; i < n && w[i] == 0xdeadbeef; i++)
        ;
    return (n - i) * 4;
#else
    return 0;
#endif
}

/* Repaints solid each time because the damage tracker keeps untouched pixels. */
static void draw_hud(struct perf *perf, bool boosted)
{
    char text[128];
    long now = current_tick;

    if (!(perf->frames & 31))
        perf->stack = stack_used();
    snprintf(text, sizeof(text), "%ld%c m%lu d%lu r%lu l%lu a%lu%% s%luK f%luK",
             16 * HZ / MAX(now - perf->since, 1), boosted ? 'B' : 'i',
             perf->phase[0] / 1000, perf->phase[1] / 1000,
             perf->phase[2] / 1000, perf->phase[3] / 1000,
             perf->area, perf->stack / 1024,
             (unsigned long)(core_available() / 1024));
    perf->since = now;
    lcd_set_drawmode(DRMODE_SOLID | DRMODE_INVERSEVID);
    lcd_fillrect(0, LCD_HEIGHT - HUD_H, LCD_WIDTH, HUD_H);
    lcd_set_drawmode(DRMODE_SOLID);
    lcd_putsxy(2, LCD_HEIGHT - HUD_H + 1, text);
    lcd_update_rect(0, LCD_HEIGHT - HUD_H, LCD_WIDTH, HUD_H);
}
#else
#define HUD_H 0
#endif

/* The classic iPod click, on the piezo: one per wheel step and per press. */
static void click(void)
{
#if defined(HAVE_HARDWARE_CLICK) && !defined(SIMULATOR)
    if (classicos_clicker())
        piezo_button_beep(false, false);
#endif
}

static void usb_mode(void)
{
    lcd_clear_display();
    lcd_putsxy(8, 8, "USB connected");
    lcd_update();
    classicos_settings_flush();
    usb_acknowledge(SYS_USB_CONNECTED_ACK, button_get_data());
    while (button_get(true) != SYS_USB_DISCONNECTED)
        ;
    pocketjs_invalidate();
}

void classicos_host_run(void)
{
    fb_data *fb = lcd_set_viewport(NULL)->buffer->fb_ptr;
    int rects[8][4], count, ret;
    long b = BUTTON_NONE, now, left, frame_start, last_input, last_active, play_down = 0;
    bool boosted = false;
#ifdef PJS_HUD
    struct perf perf = { 0 };
    uint32_t t[3], lcd_start = 0;
#endif

    lcd_set_foreground(LCD_WHITE);
    lcd_set_background(LCD_BLACK);
    lcd_setfont(FONT_SYSFIXED);

    set_boost(&boosted, true);
    ret = pocketjs_init(heap, sizeof(heap), LCD_WIDTH, LCD_HEIGHT);
    if (ret != 0)
        panicf(ret == -2 ? "PocketJS: font or image missing in " DATA_DIR
                         : "PocketJS: init failed (%d)", ret);
    last_input = last_active = current_tick;
#ifdef PJS_HUD
    perf.since = last_active;
#endif

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
            else if (b == SYS_POWEROFF) {
                classicos_settings_flush();
                shutdown_hw(SHUTDOWN_POWER_OFF);
            }
            else if (b == BUTTON_PLAY)
                play_down = frame_start;
            else if (b == (BUTTON_PLAY | BUTTON_REL)) {
                if (play_down)  /* short press; a long one powered off */
                    media_play_pause();
                play_down = 0;
            }
            else if (b == (BUTTON_RIGHT | BUTTON_REL))
                media_skip(1);
            else if (b == (BUTTON_LEFT | BUTTON_REL))
                media_skip(-1);
            else if (!(b & (SYS_EVENT | BUTTON_REL))) {
                if (b & BUTTON_SCROLL_FWD)
                    wheel++;
                else if (b & BUTTON_SCROLL_BACK)
                    wheel--;
            }
            /* Wheel steps can arrive flagged as repeats; a held button's
             * repeats stay silent. */
            if (!(b & (SYS_EVENT | BUTTON_REL)) &&
                (!(b & BUTTON_REPEAT) || (b & (BUTTON_SCROLL_FWD | BUTTON_SCROLL_BACK))))
                click();
        }

        /* hold Play = power off until Control Center exists */
        if ((held & PJ_PLAY) && play_down &&
            TIME_AFTER(frame_start, play_down + POWEROFF_HOLD)) {
            play_down = 0;
            sys_poweroff();
        }

        /* Boost only for input: animations alone (e.g. a title marquee)
         * repaint small areas and run fine at the normal clock. Repaints
         * still keep the busy frame rate. */
        if (held || wheel) {
            set_boost(&boosted, true);
            last_input = last_active = frame_start;
        }
        count = pocketjs_frame(fb, LCD_WIDTH, LCD_HEIGHT, held, wheel, rects);
#ifdef PJS_HUD
        lcd_start = pocketjs_host_usec();
#endif
        for (int i = 0; i < count; i++) {
            int h = MIN(rects[i][3], LCD_HEIGHT - HUD_H - rects[i][1]);
            if (h > 0)
                lcd_update_rect(rects[i][0], rects[i][1], rects[i][2], h);
        }
        if (count)
            last_active = frame_start;
#ifdef PJS_HUD
        pocketjs_timings(t);
        for (int i = 0; i < 3; i++)
            average(&perf.phase[i], t[i]);
        if (count) {
            unsigned long px = 0;
            for (int i = 0; i < count; i++)
                px += rects[i][2] * rects[i][3];
            perf.area = px * 100 / (LCD_WIDTH * LCD_HEIGHT);
            average(&perf.phase[3], pocketjs_host_usec() - lcd_start);
        }
        if (!(++perf.frames & 15))
            draw_hud(&perf, boosted);
#endif

        now = current_tick;
        if (boosted && TIME_AFTER(now, last_input + IDLE_AFTER))
            set_boost(&boosted, false);
        left = frame_start + (TIME_AFTER(now, last_active + IDLE_AFTER) ? IDLE_PERIOD : BUSY_PERIOD) - now;
        b = left > 0 ? button_get_w_tmo(left) : BUTTON_NONE;
    }
}
