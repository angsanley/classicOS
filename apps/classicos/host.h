/* PocketJS host loop (host.c) */
void classicos_host_run(void);

/* HUD showed a 24-27K high-water mark; overflow panics ("Stkov") on the next
 * thread switch, so this fails loudly if a deeper UI needs more. */
/* The compiled app's mount/frame code grows with the app: 50K peak with
 * Library and Control Center (PJS_HUD "s"). Headroom for more screens. */
#define UI_STACK_SIZE (96 * 1024)
#if (CONFIG_PLATFORM & PLATFORM_NATIVE)
extern unsigned char ui_stack[UI_STACK_SIZE];
#endif
