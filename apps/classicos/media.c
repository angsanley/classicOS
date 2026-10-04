/* Hardware media keys. Per the input model, Play/Prev/Next always control
 * playback, whatever app is open. */

#include "config.h"
#include <stdio.h>
#include <string.h>
#include "dir.h"
#include "audio.h"
#include "playlist.h"
#include "metadata.h"
#include "media.h"

#define MUSIC_DIR "/Music"

/* Queues audio files under dir, descending `depth` more folder levels.
 * Returns the number queued. */
static int queue_dir(const char *dir, int depth)
{
    char path[MAX_PATH];
    struct dirent *e;
    DIR *d = opendir(dir);
    int n = 0;

    if (!d)
        return 0;
    while ((e = readdir(d))) {
        if (e->d_name[0] == '.')
            continue;
        if (snprintf(path, sizeof(path), "%s/%s", dir, e->d_name) >= (int)sizeof(path))
            continue;
        if (dir_get_info(d, e).attribute & ATTR_DIRECTORY) {
            if (depth > 0)
                n += queue_dir(path, depth - 1);
        } else if (probe_file_format(path) != AFMT_UNKNOWN &&
                   playlist_insert_track(NULL, path, PLAYLIST_INSERT_LAST, false, false) >= 0) {
            n++;
        }
    }
    closedir(d);
    return n;
}

/* plays everything under /Music (Artist/Album deep) in directory
 * order until the Music app picks what to play. */
static void play_music_dir(void)
{
    playlist_create(MUSIC_DIR, NULL);
    if (queue_dir(MUSIC_DIR, 2) > 0) {
        playlist_sync(NULL);
        playlist_start(0, 0, 0);
    }
}

void media_play_pause(void)
{
    int status = audio_status();

    if (!(status & AUDIO_STATUS_PLAY))
        play_music_dir();
    else if (status & AUDIO_STATUS_PAUSE)
        audio_resume();
    else
        audio_pause();
}

void media_skip(int direction)
{
    if (!(audio_status() & AUDIO_STATUS_PLAY))
        return;
    if (direction > 0)
        audio_next();
    else
        audio_prev();
}
