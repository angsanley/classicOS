/* Settings: audio defaults for the Rockbox playback engine (based on
 * CrazyPod's crazypod_audio_settings_init()) and the user's display prefs,
 * saved to PREFS_FILE. global_settings itself is not persisted. */

#include "config.h"
#include <limits.h>
#include <string.h>
#include "settings.h"
#include "sound.h"
#include "usb.h"
#include "backlight.h"
#include "file.h"
#include "ata_idle_notify.h"
#include "misc.h"
#include "audio.h"
#include "playlist.h"
#include "settings_classicos.h"
#ifdef HAVE_HARDWARE_CLICK
#include "piezo.h"
#endif

#define PREFS_FILE ROCKBOX_DIR "/classicos/settings.bin"
#define PREFS_VERSION 3

/* What the Settings app changes. Bump PREFS_VERSION when the layout changes;
 * an old or missing file falls back to these defaults. */
static struct prefs {
    uint8_t version;
    uint8_t brightness;  /* MIN_BRIGHTNESS_SETTING..MAX_BRIGHTNESS_SETTING */
    int16_t backlight;   /* seconds, 0 = always on */
    uint8_t clicker;     /* CLICKER_* mask: click on wheel steps and presses */
    uint8_t shuffle;     /* global_settings.playlist_shuffle */
    uint8_t repeat;      /* global_settings.repeat_mode: REPEAT_OFF/ALL/ONE */
} prefs = { PREFS_VERSION, 28, 30, 1, 0, REPEAT_OFF };
static bool prefs_dirty;

/* global_status (resume position, volume), Rockbox's resume info. playlist.c
 * keeps it current and calls status_save(); stored whole, size-checked. */
#define STATUS_FILE ROCKBOX_DIR "/classicos/status.bin"
static bool status_dirty;

struct user_settings global_settings;
struct system_status global_status;

static void prefs_load(void)
{
    struct prefs saved;
    int fd = open(PREFS_FILE, O_RDONLY);
    if (fd < 0)
        return;
    if (read(fd, &saved, sizeof(saved)) == sizeof(saved) && saved.version == PREFS_VERSION)
        prefs = saved;
    close(fd);
}

/* Runs when the disk next goes idle (see prefs_changed) and at power-off. */
static void prefs_save(void)
{
    int fd;
    if (!prefs_dirty)
        return;
    prefs_dirty = false;
    fd = open(PREFS_FILE, O_WRONLY | O_CREAT | O_TRUNC, 0666);
    if (fd < 0)
        return;
    write(fd, &prefs, sizeof(prefs));
    close(fd);
}

/* Saves on the next disk spin-down instead of spinning the disk up now, so a
 * wheel turn through brightness levels costs no I/O (as Rockbox's settings). */
static void prefs_changed(void)
{
    prefs_dirty = true;
    register_storage_idle_func(prefs_save);
}

static void status_load(void)
{
    struct system_status saved;
    int fd = open(STATUS_FILE, O_RDONLY);
    if (fd < 0)
        return;
    if (read(fd, &saved, sizeof(saved)) == sizeof(saved))
        global_status = saved;
    close(fd);
}

static void status_write(void)
{
    int fd;
    if (!status_dirty)
        return;
    status_dirty = false;
    fd = open(STATUS_FILE, O_WRONLY | O_CREAT | O_TRUNC, 0666);
    if (fd < 0)
        return;
    write(fd, &global_status, sizeof(global_status));
    close(fd);
}

/* As apps/settings.c: written when the disk next idles, or now if forced. */
void status_save(bool force)
{
    status_dirty = true;
    if (force)
        status_write();
    else
        register_storage_idle_func(status_write);
}

void classicos_settings_flush(void)
{
    prefs_save();
    status_write();
}

int classicos_brightness(void)
{
    return prefs.brightness;
}

int classicos_backlight(void)
{
    return prefs.backlight;
}

int classicos_clicker(void)
{
    return prefs.clicker;
}

/* From apps/settings_list.c shuffle_playlist_callback() (replaygain and
 * iAP left out): a playing queue is reshuffled or put back in order. */
int classicos_set_shuffle(int on)
{
    on = on != 0;
    global_settings.playlist_shuffle = on;
    struct playlist_info *playlist = playlist_get_current();
    if (playlist->started && (audio_status() & AUDIO_STATUS_PLAY) == AUDIO_STATUS_PLAY) {
        if (on)
            playlist_randomise(playlist, current_tick, true);
        else
            playlist_sort(playlist, true);
    }
    if (on != prefs.shuffle) {
        prefs.shuffle = on;
        prefs_changed();
    }
    return prefs.shuffle;
}

/* From apps/settings_list.c repeat_mode_callback(): playing tracks reload
 * so the next track follows the new mode. Off, all or one. */
int classicos_set_repeat(int mode)
{
    if (mode != REPEAT_ALL && mode != REPEAT_ONE)
        mode = REPEAT_OFF;
    global_settings.repeat_mode = mode;
    if ((audio_status() & AUDIO_STATUS_PLAY) == AUDIO_STATUS_PLAY)
        audio_flush_and_reload_tracks();
    if (mode != prefs.repeat) {
        prefs.repeat = mode;
        prefs_changed();
    }
    return prefs.repeat;
}

int classicos_shuffle(void) { return prefs.shuffle; }
int classicos_repeat(void) { return prefs.repeat; }

int classicos_set_clicker(int mode)
{
    mode &= CLICKER_SPEAKER | CLICKER_HEADPHONES;
    if (mode != prefs.clicker) {
        prefs.clicker = mode;
        prefs_changed();
    }
    return prefs.clicker;
}

void classicos_click(void)
{
#if defined(HAVE_HARDWARE_CLICK) && !defined(SIMULATOR)
    if (prefs.clicker & CLICKER_SPEAKER)
        piezo_button_beep(false, false);
#endif
    /* Rockbox's keyclick tone; it follows the volume like the music. */
    if (prefs.clicker & CLICKER_HEADPHONES)
        beep_play(4000, KEYCLICK_DURATION, 2500);
}

int classicos_set_brightness(int level)
{
#ifdef HAVE_BACKLIGHT_BRIGHTNESS
    level = MAX(MIN_BRIGHTNESS_SETTING, MIN(MAX_BRIGHTNESS_SETTING, level));
    backlight_set_brightness(level);
    if (level != prefs.brightness) {
        prefs.brightness = level;
        prefs_changed();
    }
#endif
    return prefs.brightness;
}

int classicos_set_backlight(int seconds)
{
    seconds = MAX(0, MIN(3600, seconds));
#ifdef HAVE_BACKLIGHT
    backlight_set_timeout(seconds);
#if CONFIG_CHARGING
    backlight_set_timeout_plugged(seconds);
#endif
#endif
    if (seconds != prefs.backlight) {
        prefs.backlight = seconds;
        prefs_changed();
    }
    return prefs.backlight;
}

/* An unset LCD sleep timeout means "sleep the next tick after the backlight
 * goes off", so it is always set. */
static void display_settings_apply(void)
{
    prefs_load();
    global_settings.playlist_shuffle = prefs.shuffle;
    global_settings.repeat_mode = prefs.repeat;
    classicos_set_brightness(prefs.brightness);
    classicos_set_backlight(prefs.backlight);
#ifdef HAVE_LCD_SLEEP_SETTING
    lcd_set_sleep_after_backlight_off(10);
#endif
}

void classicos_settings_init(void)
{
    memset(&global_settings, 0, sizeof(global_settings));
    memset(&global_status, 0, sizeof(global_status));
    global_status.volume = -25;
    global_status.resume_index = -1;
    status_load();
    global_settings.stereo_width = 100;
    global_settings.repeat_mode = REPEAT_OFF;
    global_settings.single_mode = SINGLE_MODE_OFF;
    global_settings.max_files_in_playlist = 10000;
#ifdef HAVE_USB_CHARGING_ENABLE
    /* iPod Video: always ask the host for 500mA. At 100mA (the zeroed
     * default) HDD writes over USB brown out and the volume drops. */
    global_settings.usb_charging = TARGET_USB_CHARGING_DEFAULT;
#endif
#ifdef HAVE_DISK_STORAGE
    global_settings.buffer_margin = 5;
#endif
#ifdef HAVE_ALBUMART
    global_settings.album_art = AA_PREFER_EMBEDDED;
#endif
#ifdef HAVE_CROSSFADE
    global_settings.crossfade = CROSSFADE_ENABLE_OFF;
#endif
    /* Music database: built from /Music, kept on disk in /.rockbox. */
    strcpy(global_settings.tagcache_scan_paths, "/Music");
    strcpy(global_settings.tagcache_db_path, ROCKBOX_DIR);
    display_settings_apply();
}

void sound_settings_apply(void)
{
#ifdef AUDIOHW_HAVE_BASS
    sound_set(SOUND_BASS, global_settings.bass);
#endif
#ifdef AUDIOHW_HAVE_TREBLE
    sound_set(SOUND_TREBLE, global_settings.treble);
#endif
    sound_set(SOUND_BALANCE, global_settings.balance);
#ifndef PLATFORM_HAS_VOLUME_CHANGE
    sound_set(SOUND_VOLUME, global_status.volume);
#endif
    sound_set(SOUND_CHANNELS, global_settings.channel_config);
    sound_set(SOUND_STEREO_WIDTH, global_settings.stereo_width);
}
