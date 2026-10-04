/* PocketJS host loop (host.c) */
void classicos_host_run(void);

#define UI_STACK_SIZE (256 * 1024)
#if (CONFIG_PLATFORM & PLATFORM_NATIVE)
extern unsigned char ui_stack[UI_STACK_SIZE];
#endif
