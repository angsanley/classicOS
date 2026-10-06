/* Music library: Rockbox's tagcache database, browsed with tagtree (the
 * Rockbox Database browser) through one tree context, the way apps/tree.c
 * drives it. The menu comes from tagnavi_user.config. */

#include "config.h"
#include <string.h>
#include "file.h"
#include "kernel.h"
#include "string-extra.h"
#include "core_alloc.h"
#include "settings.h"
#include "tree.h"
#include "tagcache.h"
#include "tagtree.h"
#include "filetypes.h"
#include "lang.h"
#include "library.h"

/* Rockbox's max_files_in_dir default; tagtree pages longer lists itself. */
#define LIBRARY_CACHE_ENTRIES 400

static struct tree_context tc;

/* tagtree starts lists with special rows ([All tracks sorted by album],
 * [All tracks], [Random]). Apple shows "All Songs" only in an artist's
 * album list, so the rest are hidden. Then Rockbox sorts [Untagged] first;
 * Apple puts Unknown Artist/Album last, so it moves to the end. Visible
 * rows: the kept specials, then the ordinary rows (tree rows from
 * `specials` on) with any [Untagged] one rotated to the end. */
static int kept[3];
static int kept_count;
static int specials;
static bool untagged_first;

/* Lang id of a tree row's name, -1 for an ordinary row */
static int row_lang_id(int row)
{
    char buf[8];
    unsigned char *name = (unsigned char *)tagtree_get_entry_name(&tc, row, buf, sizeof(buf));
    return name ? P2ID(name) : -1;
}

static void map_specials(void)
{
    char name[64];
    specials = tc.dirlevel > 0 ? tc.special_entry_count : 0;
    kept_count = 0;
    for (int i = 0; i < specials && i < 3; i++) {
        /* Top-level lists (Artists, Albums) have no "All" row; below that
         * keep the album-sorted one, which Apple calls All Songs. */
        if (tc.dirlevel > 1 && row_lang_id(i) == LANG_TAGNAVI_ALL_TRACKS_SORTED_BY_ALBUM)
            kept[kept_count++] = i;
    }
    untagged_first = false;
    if (tc.dirlevel > 0 && specials < tc.filesindir) {
        tagtree_get_entry_name(&tc, specials, name, sizeof(name));
        untagged_first = !strcmp(name, str(LANG_TAGNAVI_UNTAGGED));
    }
}

static int tree_row(int row)
{
    if (row < kept_count)
        return kept[row];
    int t = row - kept_count, n = tc.filesindir - specials;
    if (untagged_first)
        return t == n - 1 ? specials : specials + 1 + t;
    return specials + t;
}

static int visible_row(int row)
{
    for (int i = 0; i < kept_count; i++)
        if (kept[i] == row)
            return i;
    if (row < specials)
        return 0;
    int t = row - specials, n = tc.filesindir - specials;
    if (untagged_first)
        return kept_count + (t == 0 ? n - 1 : t - 1);
    return kept_count + t;
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

/* Builds the database in the background, once per boot. A finished scan
 * waits in database_tmp.tcd until tagcache can borrow RAM to commit it
 * (right away on the iPod; the sim, without dircache, at the next boot).
 * no auto-rescan; new music needs an Update Library action. */
static bool build_requested;

static void build(void)
{
    build_requested = true;
    tagcache_rebuild();
}

void library_init(void)
{
    tagcache_init();
    /* As apps/main.c init_tagcache(): let tagcache finish starting up (and
     * commit a pending scan) before tagtree takes its RAM. */
    while (!tagcache_is_initialized())
        sleep(HZ/4);
    if (!file_exists(ROCKBOX_DIR "/database_idx.tcd") &&
        !file_exists(ROCKBOX_DIR "/database_tmp.tcd"))
        build();
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
    if (!tagcache_is_usable()) {
        /* No database and nothing pending, e.g. tagcache dropped a broken
         * scan at boot: start one. */
        if (!build_requested && tagcache_get_stat()->initialized &&
            !file_exists(ROCKBOX_DIR "/database_tmp.tcd"))
            build();
        return -1;
    }
    int rc = tagtree_load(&tc);
    map_specials();
    return rc;
}

int library_count(void)
{
    /* A failed load (filesindir 0) still counted its specials */
    int n = tc.filesindir - specials + kept_count;
    return n > 0 ? n : 0;
}

bool library_tracks(void)
{
    return tc.dirlevel > 0 && tagtree_get_attr(&tc) == FILE_ATTR_AUDIO;
}

/* Song lists formatted title 0x1F artist (pp_song in tagnavi_user.config).
 * Untagged files show their file name without one and sort anywhere, so
 * look past them. the first 32 rows; a list of only untagged files
 * stays one line. */
bool library_two_line(void)
{
    char name[128];
    if (!library_tracks())
        return false;
    for (int i = 0; i < library_count() && i < 32; i++) {
        library_row(i, name, sizeof(name));
        if (strchr(name, '\x1f'))
            return true;
    }
    return false;
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

/* As Rockbox's Database > Update Now: new and removed files, in the
 * background. Without a database yet, build one. */
void library_update(void)
{
    if (tagcache_is_usable())
        tagcache_update();
    else if (!build_requested)
        build();
}
