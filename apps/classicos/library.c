/* Music library: Rockbox's tagcache database, built from /Music. */

#include "config.h"
#include "file.h"
#include "tagcache.h"
#include "settings.h"
#include "library.h"

void library_init(void)
{
    tagcache_init();
    /* First boot (or after a wipe): build the database in the background.
     * A scan left in database_tmp.tcd is committed by tagcache at boot; the
     * sim (no dircache to borrow RAM from) always defers it to then.
     * no auto-rescan; new music needs an Update Library action. */
    if (!file_exists(ROCKBOX_DIR "/database_idx.tcd") &&
        !file_exists(ROCKBOX_DIR "/database_tmp.tcd"))
        tagcache_rebuild();
}
