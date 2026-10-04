/* classicOS entry point: boots the Rockbox firmware layer, then runs the
 * classicOS UI instead of the Rockbox root menu. Init order follows
 * apps/main.c init(). */

#include "config.h"
#include <stdio.h>
#include "system.h"
#include "kernel.h"
#include "../kernel-internal.h"
#include "core_alloc.h"
#include "lcd.h"
#include "font.h"
#include "button.h"
#include "backlight.h"
#include "powermgmt.h"
#include "power.h"
#include "storage.h"
#include "disk.h"
#include "usb.h"
#include "panic.h"
#include "file_internal.h"
#include "host.h"

#if (CONFIG_PLATFORM & PLATFORM_NATIVE)
#include "i2c.h"
#include "adc.h"
#if CONFIG_RTC
#include "rtc.h"
#endif
#ifdef HAVE_BOOTDATA
#include "bootdata.h"
#endif
#endif

#ifdef SIMULATOR
#include "sim_tasks.h"
#endif

#if (CONFIG_PLATFORM & PLATFORM_HOSTED)

int main(int argc, char *argv[])
{
    sys_handle_argv(argc, argv);
    system_init();
    core_allocator_init();
    kernel_init();
    enable_irq();
    lcd_init();
    font_init();
    button_init();
    powermgmt_init();
    backlight_init();
#ifdef SIMULATOR
    sim_tasks_init();
#endif
    storage_init();
#ifndef USB_NONE
    usb_init();
    usb_start_monitoring();
#endif
    /* SDL ports pump events from button_get(), so the UI stays on this thread */
    classicos_host_run();
    return 0;
}

#else

#define UI_STACK_SIZE (256 * 1024)
static unsigned char ui_stack[UI_STACK_SIZE] CACHEALIGN_ATTR;

static void ui_thread(void)
{
    classicos_host_run();
    panicf("ui exited");
}

int main(void) NORETURN_ATTR;
int main(void)
{
    system_init();
    core_allocator_init();
    kernel_init();
#ifdef HAVE_BOOTDATA
    verify_boot_data();
#endif
    filesystem_init();
#ifdef HAVE_ADJUSTABLE_CPU_FREQ
    set_cpu_frequency(CPUFREQ_NORMAL);
    cpu_boost(true);
#endif
    i2c_init();
    power_init();
    enable_irq();
#ifdef CPU_ARM_CLASSIC
    enable_fiq();
#endif
    lcd_init();
    font_init();
#if CONFIG_RTC
    rtc_init();
#endif
    adc_init();
#ifndef USB_NONE
    usb_init();
#endif
    backlight_init();
    button_init();
    powermgmt_init();

    if (storage_init() != 0)
        panicf("storage init failed");
    if (disk_mount_all() <= 0)
        panicf("no filesystem");
    init_battery_tables();

#ifndef USB_NONE
    usb_start_monitoring();
#endif
#ifdef HAVE_ADJUSTABLE_CPU_FREQ
    cpu_boost(false);
#endif

    unsigned int t = create_thread(ui_thread, ui_stack, sizeof(ui_stack), 0,
                                   "classicos_ui"
                                   IF_PRIO(, PRIORITY_USER_INTERFACE)
                                   IF_COP(, CPU));
    if (t == 0)
        panicf("ui thread");
    thread_wait(t);
    panicf("ui stopped");
}

#ifdef CPU_PP
/* Second core: idles until a thread is created on it (same as apps/main.c) */
void cop_main(void) NORETURN_ATTR;
void cop_main(void)
{
#if NUM_CORES > 1
    system_init();
    kernel_init();
#endif
    while (1)
        sleep_core(COP);
}
#endif

#endif
