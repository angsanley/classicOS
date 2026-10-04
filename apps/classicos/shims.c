/* Symbols firmware/ and lib/rbcodec/ expect from the Rockbox UI (apps/).
 * Each block notes what replaces it once the real module is linked. */

#include "config.h"
#include <stdarg.h>
#include <stdio.h>
#include "file.h"
#include "panic.h"
#include "settings.h"
#include "misc.h"

struct user_settings global_settings;
struct system_status global_status;

/* no-op audio until playback.c is linked (M3) */
bool audio_is_initialized = false;
void audio_stop(void) {}
void audio_pause(void) {}
int audio_status(void) { return 0; }

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

/* timestretch buffers: unsupported for now, the DSP falls back to 1x */
bool tdspeed_alloc_buffers(int32_t **buffers, const int *buf_s, int nbuf)
{
    (void)buffers; (void)buf_s; (void)nbuf;
    return false;
}

void tdspeed_free_buffers(int32_t **buffers, int nbuf) { (void)buffers; (void)nbuf; }

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

size_t audio_buffer_available(void) { return 0; }
struct mp3entry *audio_current_track(void) { return NULL; }
void audio_flush_and_reload_tracks(void) {}
void audio_skip(int direction) { (void)direction; }
void audio_set_input_source(int source, unsigned flags) { (void)source; (void)flags; }
ssize_t bufgetdata(int handle_id, size_t size, void **data)
{
    (void)handle_id; (void)size; (void)data;
    return -1;
}
int playback_claim_aa_slot(struct dim *dim) { (void)dim; return -1; }
int playback_current_aa_hid(int slot) { (void)slot; return -1; }
void playback_release_aa_slot(int slot) { (void)slot; }

int playlist_amount(void) { return 0; }
int playlist_next(int steps) { (void)steps; return -1; }
int playlist_get_display_index(void) { return 0; }
int playlist_get_first_index(const struct playlist_info *playlist) { (void)playlist; return 0; }
int playlist_get_track_info(struct playlist_info *playlist, int index,
                            struct playlist_track_info *info)
{
    (void)playlist; (void)index; (void)info;
    return -1;
}
int playlist_randomise(struct playlist_info *playlist, unsigned int seed, bool start_current)
{
    (void)playlist; (void)seed; (void)start_current;
    return -1;
}
int playlist_sort(struct playlist_info *playlist, bool start_current)
{
    (void)playlist; (void)start_current;
    return -1;
}

void adjust_volume(int steps) { (void)steps; }
void setvol(void) {}
int settings_save(void) { return 0; }
int open_utf8(const char *pathname, int flags) { return open(pathname, flags, 0666); }

#ifdef IPOD_ACCESSORY_PROTOCOL
bool iap_getc(IF_IAP_MP(int port,) unsigned char x) { (void)x; return false; }
void iap_reset_state(IF_IAP_MP_NONVOID(int port)) {}
int remote_control_rx(void) { return 0; }
#endif
