/* State behind the PocketJS playback and system model services
 * (pocketjs/hosts/rockbox/src/services.rs). The structs mirror the Rust
 * repr(C) definitions there. */

#include "config.h"
#include <string.h>
#include "string-extra.h"
#include "audio.h"
#include "metadata.h"
#include "playlist.h"
#include "settings.h"
#include "powermgmt.h"
#include "power.h"
#include "timefuncs.h"
#include "sound.h"
#include "buffering.h"
#include "playback.h"
#include "services.h"
#include "appevents.h"
#include "button.h"
#include "mv.h"
#include "rbversion.h"
#include "settings_classicos.h"
#include "library.h"
#include "tagcache.h"
#ifdef HAVE_ALBUMART
#include "bmp.h"
#include "albumart.h"
#endif

struct pocketjs_playback {
    int32_t status; /* 0 stopped, 1 playing, 2 paused */
    int32_t index;
    int32_t elapsed_ms;
    int32_t duration_ms;
    int32_t volume;
    int32_t shuffle;
    char path[260];
    char title[128];
    char artist[128];
    char album[128];
    char codec[16]; /* Rockbox format label, e.g. "FLAC", "MP3" */
    int32_t frequency; /* Hz */
    int32_t bitrate; /* kbps */
    int32_t volume_min; /* dB, the codec's range */
    int32_t volume_max;
};

struct pocketjs_system {
    int32_t battery_percent;
    int32_t charging; /* charging now */
    int32_t plugged;  /* on external power, charging or full */
    int32_t hold;     /* hold switch on */
    int32_t hour;
    int32_t minute;
    int32_t weekday;
    int32_t day;
    int32_t month;
    int32_t brightness;
    int32_t brightness_min;
    int32_t brightness_max;
    int32_t backlight; /* seconds, 0 = always on */
    int32_t clicker;
};

struct pocketjs_about {
    char version[32];
    int32_t disk_mb;
    int32_t free_mb;
    int32_t songs; /* tracks in the music database, -1 while it isn't ready */
};

/* audio_current_track() fills the playing track's metadata on demand. Asked
 * before that track's buffers are ready, it caches a path-only fallback, so
 * only ask once playback says the track is ready (like the Rockbox WPS does
 * after its track-change event). Set from the audio thread. */
static volatile bool track_ready;

static void on_playback_start(unsigned short id, void *data)
{
    (void)id; (void)data;
    track_ready = false;
}

static void on_track_ready(unsigned short id, void *data)
{
    (void)id; (void)data;
    track_ready = true;
}

void pocketjs_host_playback(struct pocketjs_playback *out)
{
    int status = audio_status();
    struct mp3entry *id3 = (status & AUDIO_STATUS_PLAY) && track_ready ? audio_current_track() : NULL;

    memset(out, 0, sizeof(*out));
    out->volume = global_status.volume;
    out->volume_min = sound_min(SOUND_VOLUME);
    out->volume_max = sound_max(SOUND_VOLUME);
    out->shuffle = global_settings.playlist_shuffle;
    if (status & AUDIO_STATUS_PLAY)
        out->status = (status & AUDIO_STATUS_PAUSE) ? 2 : 1;
    if (!id3)
        return;
    out->index = playlist_get_display_index() - 1;
    out->elapsed_ms = id3->elapsed;
    out->duration_ms = id3->length;
    strlcpy(out->path, id3->path, sizeof(out->path));
    if (id3->title) {
        strlcpy(out->title, id3->title, sizeof(out->title));
    } else {
        /* untagged file: show its name */
        const char *name = strrchr(id3->path, '/');
        strlcpy(out->title, name ? name + 1 : id3->path, sizeof(out->title));
    }
    if (id3->artist)
        strlcpy(out->artist, id3->artist, sizeof(out->artist));
    if (id3->album)
        strlcpy(out->album, id3->album, sizeof(out->album));
    if (id3->codectype < AFMT_NUM_CODECS)
        strlcpy(out->codec, audio_formats[id3->codectype].label, sizeof(out->codec));
    out->frequency = id3->frequency;
    out->bitrate = id3->bitrate;
}

/* Clamps to the codec's range, applies it and returns the applied volume. */
int32_t pocketjs_host_set_volume(int32_t db)
{
    db = MAX(sound_min(SOUND_VOLUME), MIN(sound_max(SOUND_VOLUME), db));
    global_status.volume = db;
    sound_set(SOUND_VOLUME, db);
    return db;
}

void pocketjs_host_system(struct pocketjs_system *out)
{
    struct tm *tm = get_time();

    memset(out, 0, sizeof(*out));
    out->battery_percent = battery_level();
#if CONFIG_CHARGING
    out->charging = charging_state();
    out->plugged = charger_inserted();
#endif
#ifdef HAS_BUTTON_HOLD
    out->hold = button_hold();
#endif
    out->hour = tm->tm_hour;
    out->minute = tm->tm_min;
    out->weekday = tm->tm_wday;
    out->day = tm->tm_mday;
    out->month = tm->tm_mon + 1;
    out->brightness = classicos_brightness();
#ifdef HAVE_BACKLIGHT_BRIGHTNESS
    out->brightness_min = MIN_BRIGHTNESS_SETTING;
    out->brightness_max = MAX_BRIGHTNESS_SETTING;
#else
    out->brightness_min = out->brightness_max = out->brightness;
#endif
    out->backlight = classicos_backlight();
    out->clicker = classicos_clicker();
}

int32_t pocketjs_host_set_clicker(int32_t mode)
{
    return classicos_set_clicker(mode);
}

int32_t pocketjs_host_set_brightness(int32_t level)
{
    return classicos_set_brightness(level);
}

int32_t pocketjs_host_set_backlight(int32_t seconds)
{
    return classicos_set_backlight(seconds);
}

/* Static facts for Settings > About. Sizes come from the FAT's cached free
 * count, so this does not touch the disk. */
void pocketjs_host_about(struct pocketjs_about *out)
{
    sector_t size_kib, free_kib;

    memset(out, 0, sizeof(*out));
    strlcpy(out->version, RBVERSION, sizeof(out->version));
    volume_size(IF_MV(0,) &size_kib, &free_kib);
    out->disk_mb = size_kib / 1024;
    out->free_mb = free_kib / 1024;
    out->songs = tagcache_is_usable() ? tagcache_get_stat()->total_entries : -1;
}

#ifdef HAVE_ALBUMART
static int aa_slot = -1;
#endif

void classicos_services_init(void)
{
    add_event(PLAYBACK_EVENT_START_PLAYBACK, on_playback_start);
    add_event(PLAYBACK_EVENT_CUR_TRACK_READY, on_track_ready);
    add_event(PLAYBACK_EVENT_TRACK_CHANGE, on_track_ready);
#ifdef HAVE_ALBUMART
    /* Matches ART_SIZE in pocketjs/hosts/rockbox/src/services.rs: PocketJS
     * textures are power-of-two squares. */
    struct dim dim = { 128, 128 };
    aa_slot = playback_claim_aa_slot(&dim);
#endif
}

int pocketjs_host_album_art(const fb_data **pixels, int *w, int *h)
{
#ifdef HAVE_ALBUMART
    struct bitmap *bmp;
    int handle;

    if (aa_slot < 0 || !(audio_status() & AUDIO_STATUS_PLAY))
        return -1;
    handle = playback_current_aa_hid(aa_slot);
    if (handle < 0 || bufgetdata(handle, 0, (void **)&bmp) <= 0)
        return -1;
    *pixels = (const fb_data *)bmp->data;
    *w = bmp->width;
    *h = bmp->height;
    return handle;
#else
    (void)pixels; (void)w; (void)h;
    return -1;
#endif
}

/* Mirrors Library in hosts/rockbox/src/services.rs */
struct pocketjs_library {
    int32_t count; /* -1 while the database is unavailable */
    int32_t depth;
    int32_t selected;
    int32_t playing;
    char title[128];
};

void pocketjs_host_library(int32_t op, int32_t arg, struct pocketjs_library *out)
{
    int rc = 0, result = LIBRARY_STAYED;
    if (op == 0)
        rc = library_open();
    else if (op == 1)
        result = library_enter(arg);
    else if (op == 2)
        library_back();
    else
        library_update();
    out->count = rc < 0 ? -1 : library_count();
    out->depth = library_depth();
    out->selected = library_selected();
    out->playing = result == LIBRARY_PLAYING;
    library_title(out->title, sizeof(out->title));
}

void pocketjs_host_library_row(int32_t index, char *buf, int32_t size)
{
    library_row(index, buf, size);
}
