/* Music library: Rockbox's tagcache database, browsed with tagtree (the
 * Rockbox Database browser) through one tree context, the way apps/tree.c
 * drives it. The menu comes from tagnavi_user.config. */

#include "config.h"
#include <string.h>
#include "file.h"
#include "string-extra.h"
#include "core_alloc.h"
#include "settings.h"
#include "tree.h"
#include "tagcache.h"
#include "tagtree.h"
#include "library.h"

/* Rockbox's max_files_in_dir default; tagtree pages longer lists itself. */
#define LIBRARY_CACHE_ENTRIES 400

static struct tree_context tc;

/* From apps/tree.c (tc is ours here) */
static int move_callback(int handle, void* current, void* new)
{
    struct tree_cache* cache = &tc.cache;
    ptrdiff_t diff = new - current;
    /* FIX_PTR makes sure to not accidentally update static allocations */
#define FIX_PTR(x) \
    { if ((void*)x >= current && (void*)x < (current+cache->name_buffer_size)) x+= diff; }

    if (handle == cache->name_buffer_handle)
    {   /* update entry structs, *even if they are struct tagentry */
        struct entry *this = core_get_data(cache->entries_handle);
        struct entry *last = this + cache->max_entries;
        for(; this < last; this++)
            FIX_PTR(this->name);
    }
    /* nothing to do if entries moved */
    return BUFLIB_CB_OK;
}

static struct buflib_callbacks ops = {
    .move_callback = move_callback,
    .shrink_callback = NULL,
};

void tree_lock_cache(struct tree_context *t)
{
    core_pin(t->cache.name_buffer_handle);
    core_pin(t->cache.entries_handle);
}

void tree_unlock_cache(struct tree_context *t)
{
    core_unpin(t->cache.name_buffer_handle);
    core_unpin(t->cache.entries_handle);
}

/* From apps/tree.c tree_mem_init() */
static void library_mem_init(void)
{
    struct tree_cache* cache = &tc.cache;
    memset(&tc, 0, sizeof(tc));
    tc.dirfilter = &global_settings.dirfilter;
    tc.sort_dir = global_settings.sort_dir;

    cache->name_buffer_size = AVERAGE_FILENAME_LENGTH * LIBRARY_CACHE_ENTRIES;
    cache->name_buffer_handle = core_alloc_ex(cache->name_buffer_size, &ops);

    cache->max_entries = LIBRARY_CACHE_ENTRIES;
    cache->entries_handle =
            core_alloc_ex(cache->max_entries*(sizeof(struct entry)), &ops);
}

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
    library_mem_init();
    tagtree_init();
}

int library_open(void)
{
    while (tc.dirlevel > 0)
        tagtree_exit(&tc, false);
    tc.currtable = 0;
    tc.selected_item = 0;
    return library_load();
}

int library_load(void)
{
    if (!tagcache_is_usable())
        return -1;
    return tagtree_load(&tc);
}

int library_count(void)
{
    return tc.filesindir;
}

int library_depth(void)
{
    return tc.dirlevel;
}

int library_selected(void)
{
    return tc.selected_item;
}

void library_title(char *buf, size_t size)
{
    strmemccpy(buf, tc.dirlevel > 0 ? tagtree_get_title(&tc) : "Music", size);
}

void library_row(int index, char *buf, size_t size)
{
    buf[0] = '\0';
    if (index >= 0 && index < tc.filesindir)
        tagtree_get_entry_name(&tc, index, buf, size);
}

int library_enter(int index)
{
    if (index < 0 || index >= tc.filesindir)
        return LIBRARY_STAYED;
    tc.selected_item = index;
    /* 2: a track was picked and its list now plays from it (tree.c) */
    if (tagtree_enter(&tc, true) == 2)
        return LIBRARY_PLAYING;
    library_load();
    return LIBRARY_ENTERED;
}

bool library_back(void)
{
    if (tc.dirlevel == 0)
        return false;
    tagtree_exit(&tc, true);
    library_load();
    return true;
}
