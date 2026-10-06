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
#include "lang.h"
#include "library.h"

/* Rockbox's max_files_in_dir default; tagtree pages longer lists itself. */
#define LIBRARY_CACHE_ENTRIES 400

static struct tree_context tc;

/* tagtree starts lists with special rows ([All tracks sorted by album],
 * [All tracks], [Random]). Apple shows "All Songs" only in an artist's
 * album list, so the rest are hidden: rows here skip `hidden` of them.
 * Specials always come first, so visible row v is tree row v + hidden
 * once past the kept ones. */
static int kept[3];
static int kept_count;
static int hidden;

/* Lang id of a tree row's name, -1 for an ordinary row */
static int row_lang_id(int row)
{
    char buf[8];
    unsigned char *name = (unsigned char *)tagtree_get_entry_name(&tc, row, buf, sizeof(buf));
    return name ? P2ID(name) : -1;
}

static void map_specials(void)
{
    int specials = tc.dirlevel > 0 ? tc.special_entry_count : 0;
    kept_count = 0;
    for (int i = 0; i < specials && i < 3; i++) {
        /* Top-level lists (Artists, Albums) have no "All" row; below that
         * keep the album-sorted one, which Apple calls All Songs. */
        if (tc.dirlevel > 1 && row_lang_id(i) == LANG_TAGNAVI_ALL_TRACKS_SORTED_BY_ALBUM)
            kept[kept_count++] = i;
    }
    hidden = specials - kept_count;
}

static int tree_row(int row)
{
    return row < kept_count ? kept[row] : row + hidden;
}

static int visible_row(int row)
{
    for (int i = 0; i < kept_count; i++)
        if (kept[i] == row)
            return i;
    return row < hidden + kept_count ? 0 : row - hidden;
}

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
    int rc = tagtree_load(&tc);
    map_specials();
    return rc;
}

int library_count(void)
{
    return tc.filesindir - hidden;
}

int library_depth(void)
{
    return tc.dirlevel;
}

int library_selected(void)
{
    return visible_row(tc.selected_item);
}

void library_title(char *buf, size_t size)
{
    strmemccpy(buf, tc.dirlevel > 0 ? tagtree_get_title(&tc) : "Music", size);
}

void library_row(int index, char *buf, size_t size)
{
    buf[0] = '\0';
    if (index < 0 || index >= library_count())
        return;
    int row = tree_row(index);
    if (row_lang_id(row) == LANG_TAGNAVI_ALL_TRACKS_SORTED_BY_ALBUM) {
        strmemccpy(buf, "All Songs", size);
        return;
    }
    tagtree_get_entry_name(&tc, row, buf, size);
    /* Missing tags: Apple's names. Untagged only appears in the Artists
     * and Albums lists and an artist's albums (songs fall back to the file
     * name). */
    if (!strcmp(buf, str(LANG_TAGNAVI_UNTAGGED)))
        strmemccpy(buf, tc.dirlevel == 1 && !strcmp(tagtree_get_title(&tc), "Artists")
                        ? "Unknown Artist" : "Unknown Album", size);
}

int library_enter(int index)
{
    if (index < 0 || index >= library_count())
        return LIBRARY_STAYED;
    tc.selected_item = tree_row(index);
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
