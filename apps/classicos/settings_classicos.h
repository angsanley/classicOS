/* Settings (settings.c) */
void classicos_settings_init(void);
/** Writes pending prefs now; call before powering off. */
void classicos_settings_flush(void);
/** Display prefs; the setters clamp, apply, save later and return the value. */
int classicos_brightness(void);
int classicos_backlight(void);
int classicos_set_brightness(int level);
int classicos_set_backlight(int seconds);
/** Wheel/button click, like the iPod's Clicker setting: a CLICKER_* mask */
#define CLICKER_SPEAKER    1 /* the piezo in the case */
#define CLICKER_HEADPHONES 2 /* a beep mixed into the audio output */
int classicos_clicker(void);
int classicos_set_clicker(int mode);
/** One click on the outputs the setting picks */
void classicos_click(void);
