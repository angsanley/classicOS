/* Hardware media keys. Per the input model, Play/Prev/Next always control
 * playback, whatever app is open. */

#include "config.h"
#include <stdio.h>
#include <string.h>
#include "audio.h"
#include "playlist.h"
#include "settings.h"
#include "media.h"

/* Like the iPod after power-on: the last song is loaded and paused where it
 * stopped, so Now Playing shows it and Play continues. Resumes as the Play
 * key does, then pauses before any audio comes out. */
void media_preload(void)
{
    if (playlist_resume() != -1) {
        playlist_start(global_status.resume_index,
                       global_status.resume_elapsed,
                       global_status.resume_offset);
        audio_pause();
    }
}

void media_play_pause(void)
{
    int status = audio_status();

    /* As Rockbox's multimedia Play key (apps/misc.c): resume the last
     * playlist where it stopped. */
    if (!(status & AUDIO_STATUS_PLAY)) {
        if (playlist_resume() != -1)
            playlist_start(global_status.resume_index,
                           global_status.resume_elapsed,
                           global_status.resume_offset);
    }
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
