/* Settings (settings.c) */
void classicos_settings_init(void);
/** Writes pending prefs now; call before powering off. */
void classicos_settings_flush(void);
/** Display prefs; the setters clamp, apply, save later and return the value. */
int classicos_brightness(void);
int classicos_backlight(void);
int classicos_set_brightness(int level);
int classicos_set_backlight(int seconds);
/** Wheel/button click on the piezo: 1 on, 0 off */
int classicos_clicker(void);
int classicos_set_clicker(int on);
