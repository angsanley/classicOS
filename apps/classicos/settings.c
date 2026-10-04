/* Audio defaults for the Rockbox playback engine. classicOS has no settings
 * file yet, so global_settings starts from these values on every boot.
 * Based on CrazyPod's crazypod_audio_settings_init(). */

#include "config.h"
#include <limits.h>
#include <string.h>
#include "settings.h"
#include "sound.h"
#include "usb.h"
#include "settings_classicos.h"

struct user_settings global_settings;
struct system_status global_status;

void classicos_settings_init(void)
{
    memset(&global_settings, 0, sizeof(global_settings));
    memset(&global_status, 0, sizeof(global_status));
    global_status.volume = -25;
    global_status.resume_index = -1;
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
