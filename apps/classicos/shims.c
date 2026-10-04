/* Symbols firmware/ and lib/rbcodec/ expect from the Rockbox UI (apps/).
 * Each block notes what replaces it once the real module is linked. */

#include "config.h"
#include <stdarg.h>
#include <stdio.h>
#include <string.h>
#include "string-extra.h"
#include "file.h"
#include "panic.h"
#include "settings.h"
#include "misc.h"

int get_radio_status(void) { return 0; }

enum current_activity get_current_activity(void) { return ACTIVITY_UNKNOWN; }

void skin_request_update_locked(bool locked) { (void)locked; }

void splashf(int ticks, const char *fmt, ...) { (void)ticks; (void)fmt; }

/* powermgmt reads optional battery tables; none means built-in defaults */
int read_line(int fd, char *buffer, int buffer_size)
{
    (void)fd; (void)buffer; (void)buffer_size;
    return 0;
}

bool settings_parseline(char *line, char **name, char **value)
{
    (void)line; (void)name; (void)value;
    return false;
}

int string_option(const char *option, const char *const oplist[], bool ignore_case)
{
    (void)option; (void)oplist; (void)ignore_case;
    return -1;
}

int open_pathfmt(char *buf, size_t size, int oflag, const char *pathfmt, ...)
{
    va_list ap;
    va_start(ap, pathfmt);
    vsnprintf(buf, size, pathfmt, ap);
    va_end(ap);
    return open(buf, oflag, 0666);
}

/* only reached for viewports with a non-default stride, which we never make */
void viewport_set_buffer(struct viewport *vp, struct frame_buffer_t *buffer,
                         const enum screen_type screen)
{
    (void)vp; (void)buffer; (void)screen;
    panicf("viewport_set_buffer");
}

/* Native firmware also wires in iAP (dock), USB audio and DSP glue, which
 * call the playback engine. no-ops until playback.c lands (M3). */
#include <sys/types.h>
#include <fcntl.h>
#ifdef IPOD_ACCESSORY_PROTOCOL
#include "iap.h"
#endif

struct playlist_info;
struct playlist_track_info;
struct mp3entry;
struct dim;


void adjust_volume(int steps) { (void)steps; }
void setvol(void) {}
int settings_save(void) { return 0; }
int open_utf8(const char *pathname, int flags) { return open(pathname, flags, 0666); }

#ifdef IPOD_ACCESSORY_PROTOCOL
bool iap_getc(IF_IAP_MP(int port,) unsigned char x) { (void)x; return false; }
void iap_reset_state(IF_IAP_MP_NONVOID(int port)) {}
int remote_control_rx(void) { return 0; }
#endif

/* Playback engine hooks into UI features classicOS doesn't have (yet):
 * A-B repeat, cuesheets, voice, system sounds, FM remote. */
struct mp3entry;
struct cuesheet_file;
struct cuesheet;
struct tree_context;
struct entry;
enum system_sound;

bool ab_before_A_marker(unsigned int pos) { (void)pos; return false; }
bool ab_after_A_marker(unsigned int pos) { (void)pos; return false; }
bool ab_get_B_marker(unsigned int *pos) { (void)pos; return false; }
void ab_end_of_track_report(void) {}
void ab_jump_to_A_marker(void) {}
bool look_for_cuesheet_file(struct mp3entry *id3, struct cuesheet_file *cue_file)
{
    (void)id3; (void)cue_file;
    return false;
}
bool parse_cuesheet(struct cuesheet_file *cue_file, struct cuesheet *cue)
{
    (void)cue_file; (void)cue;
    return false;
}
void voice_stop(void) {}
void talk_buffer_set_policy(int policy) { (void)policy; }
void talk_force_enqueue_next(void) {}
void talk_force_shutup(void) {}
int talk_id(int32_t id, bool enqueue) { (void)id; (void)enqueue; return -1; }
int talk_idarray(const long *ids, bool enqueue) { (void)ids; (void)enqueue; return -1; }
int talk_number(long n, bool enqueue) { (void)n; (void)enqueue; return -1; }
void system_sound_play(enum system_sound sound) { (void)sound; }
void radio_pause(void) {}
void radio_start(void) {}
void radio_stop(void) {}

/* playlist.c UI hooks. The tree context only backs "auto-change directory"
 * and building a playlist from the file browser; classicOS queues tracks with
 * playlist_create + playlist_insert_track instead. */
bool action_userabort(int timeout) { (void)timeout; return false; }
bool check_rockboxdir(void) { return true; }
int ft_build_playlist(struct tree_context *c, int start) { (void)c; (void)start; return -1; }
int ft_load(struct tree_context *c, const char *dir) { (void)c; (void)dir; return -1; }
void reload_directory(void) {}
struct tree_context *tree_get_context(void) { return NULL; }
struct entry *tree_get_entries(struct tree_context *t) { (void)t; return NULL; }
void tree_lock_cache(struct tree_context *t) { (void)t; }
void tree_unlock_cache(struct tree_context *t) { (void)t; }
bool show_search_progress(bool init, int count, int current, int total)
{
    (void)init; (void)count; (void)current; (void)total;
    return true;
}
void splash_progress_set_delay(long delay) { (void)delay; }
void splash_progress(int current, int total, const char *fmt, ...)
{
    (void)current; (void)total; (void)fmt;
}
bool yesno_pop(const char *text) { (void)text; return false; }
void status_save(bool force) { (void)force; }
void wps_playlist_percent_prepare(void) {}

unsigned int ab_B_marker; /* AB_MARKER_NONE */

/* From apps/misc.c, used by albumart.c */
char *strip_extension(char *buffer, int buffer_size, const char *filename)
{
    if (!buffer || !filename || buffer_size <= 0)
        return NULL;

    off_t dotpos = (strrchr(filename, '.') - filename) + 1;

    /* no match on filename beginning with '.' or beyond buffer_size */
    if (dotpos > 1 && dotpos < buffer_size)
        buffer_size = dotpos;
    strmemccpy(buffer, filename, buffer_size);
    return buffer;
}

void fix_path_part(char *path, int offset, int count)
{
    static const char invalid_chars[] = "*/:<>?\\|";

    path += offset;
    for (int i = 0; i <= count; i++, path++) {
        if (*path == 0)
            return;
        if (*path == '"')
            *path = '\'';
        else if (strchr(invalid_chars, *path))
            *path = '_';
    }
}

/* Native-only engine hooks: recording (line-in accessories), the tag
 * database and the voice thread. None are built into classicOS. */
struct queue_event;

#ifdef HAVE_RECORDING
void audio_recording_handler(struct queue_event *ev) { (void)ev; }
void recording_init(void) {}
void pcm_rec_error_clear(void) {}
unsigned int pcm_rec_status(void) { return 0; }
#endif
#ifdef IPOD_ACCESSORY_PROTOCOL
bool iap_record(bool onoff) { (void)onoff; return false; }
#endif
#ifdef HAVE_TAGCACHE
bool tagcache_fill_tags(struct mp3entry *id3, const char *filename)
{
    (void)id3; (void)filename;
    return false;
}
#endif
void voice_thread_set_priority(int priority) { (void)priority; }
