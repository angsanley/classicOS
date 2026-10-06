/* Music library: Rockbox's tagcache database, browsed with tagtree (the
 * Rockbox Database browser) through one tree context, the way apps/tree.c
 * drives it, with the menu from tagnavi_user.config. Playlists come from
 * Rockbox's playlist folder (below). */

#include "config.h"
#include <stdio.h>
#include <stdlib.h>
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
#include "dir.h"
#include "pathfuncs.h"
#include "metadata.h"
#include "playlist.h"
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

/* Playlists: the .m3u/.m3u8 files in Rockbox's playlist folder
 * (PLAYLIST_CATALOG_DEFAULT_DIR, /Playlists), then one playlist's songs.
 * Picking a song plays the playlist from it, as Rockbox's file browser does
 * (playlist_create + playlist_start). fixed caps; a bigger folder
 * or playlist shows its first MAX_* entries. */
#define PLAYLIST_DIR PLAYLIST_CATALOG_DEFAULT_DIR
#define MAX_PLAYLISTS 128
#define MAX_PLAYLIST_SONGS 5000
static bool pl_active;
static char pl_names[MAX_PLAYLISTS][64]; /* file names, sorted */
static int pl_count;
static int pl_open = -1;                 /* playlist shown, -1 = the list */
static int pl_last;                      /* its row, focused again on back */
static int32_t pl_index[MAX_PLAYLIST_SONGS]; /* file offset of each entry */
static int pl_songs;
static struct mp3entry pl_id3;

static int name_cmp(const void *a, const void *b)
{
    return strcasecmp(a, b);
}

static void pl_scan(void)
{
    struct dirent *e;
    DIR *d = opendir(PLAYLIST_DIR);
    pl_count = 0;
    if (!d)
        return;
    while ((e = readdir(d)) && pl_count < MAX_PLAYLISTS) {
        const char *ext = strrchr(e->d_name, '.');
        if (e->d_name[0] == '.' || !ext ||
            (strcasecmp(ext, ".m3u") && strcasecmp(ext, ".m3u8")) ||
            strlen(e->d_name) >= sizeof(pl_names[0]))
            continue;
        strcpy(pl_names[pl_count++], e->d_name);
    }
    closedir(d);
    qsort(pl_names, pl_count, sizeof(pl_names[0]), name_cmp);
}

/* Entry offsets by the rule in apps/playlist.c add_indices_to_playlist():
 * each line not starting with '#', after any UTF-8 BOM. So row i is
 * playlist index i once playlist_create() loads the file. */
static void pl_index_songs(void)
{
    char path[MAX_PATH];
    unsigned char buf[512];
    bool line_start = true;
    ssize_t n;
    long pos = 0;
    pl_songs = 0;
    snprintf(path, sizeof(path), "%s/%s", PLAYLIST_DIR, pl_names[pl_open]);
    int fd = open(path, O_RDONLY);
    if (fd < 0)
        return;
    if (read(fd, buf, 3) == 3 && buf[0] == 0xef && buf[1] == 0xbb && buf[2] == 0xbf)
        pos = 3;
    lseek(fd, pos, SEEK_SET);
    while ((n = read(fd, buf, sizeof(buf))) > 0) {
        for (int i = 0; i < n; i++) {
            if (buf[i] == '\n' || buf[i] == '\r')
                line_start = true;
            else if (line_start) {
                line_start = false;
                if (buf[i] != '#' && pl_songs < MAX_PLAYLIST_SONGS)
                    pl_index[pl_songs++] = pos + i;
            }
        }
        pos += n;
    }
    close(fd);
}

/* From apps/playlist.c format_track_path(): a playlist line to a full path
 * (trailing blanks, backslashes, drive letters, relative paths). */
static ssize_t format_track_path(char *dest, char *src, int buf_length,
                                 const char *dir, size_t dlen)
{
    size_t len = strcspn(src, "\r\n");
    while (len > 0) {
        int c = src[len - 1];
        if (c != '\t' && c != ' ')
            break;
        len--;
    }
    src[len] = '\0';
    path_correct_separators(src, src);
    if (path_strip_drive(src, (const char **)&src, true) >= 0 &&
        src[-1] == PATH_SEPCH)
    {
#ifdef HAVE_MULTIVOLUME
        const char *p;
        path_strip_last_volume(dir, &p, false);
        dlen = (p-dir);
#else
        dir = "";
#endif
    }
    if (*dir == '\0') {
        dir = PATH_ROOTSTR;
        dlen = -1u;
    }
    len = path_append_ex(dest, dir, dlen, src, buf_length);
    if (len >= (size_t)buf_length)
        return -1;
    path_remove_dot_segments(dest, dest);
    return strlen(dest);
}

/* Name without the extension */
static void strip_ext(char *buf, size_t size, const char *name)
{
    strmemccpy(buf, name, size);
    char *dot = strrchr(buf, '.');
    if (dot && dot != buf)
        *dot = '\0';
}

/* Song row: "title 0x1F artist" from the file's tags (the file name when
 * untagged), like the Songs list */
static void pl_song_row(int index, char *buf, size_t size)
{
    char line[MAX_PATH], path[MAX_PATH];
    snprintf(path, sizeof(path), "%s/%s", PLAYLIST_DIR, pl_names[pl_open]);
    int fd = open(path, O_RDONLY);
    if (fd < 0)
        return;
    lseek(fd, pl_index[index], SEEK_SET);
    ssize_t n = read(fd, line, sizeof(line) - 1);
    close(fd);
    if (n <= 0)
        return;
    line[n] = '\0';
    if (format_track_path(path, line, sizeof(path), PLAYLIST_DIR, -1u) < 0)
        return;
    memset(&pl_id3, 0, sizeof(pl_id3));
    fd = open(path, O_RDONLY);
    bool tags = fd >= 0 && get_metadata(&pl_id3, fd, path) && pl_id3.title;
    if (fd >= 0)
        close(fd);
    if (tags)
        snprintf(buf, size, "%s\x1f%s", pl_id3.title, pl_id3.artist ? pl_id3.artist : "");
    else {
        const char *base = strrchr(path, '/');
        strip_ext(buf, size, base ? base + 1 : path);
    }
}

int library_open_playlists(void)
{
    pl_active = true;
    pl_open = -1;
    pl_last = 0;
    pl_scan();
    return 0;
}

int library_open(void)
{
    pl_active = false;
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
    if (pl_active)
        return pl_open < 0 ? pl_count : pl_songs;
    /* A failed load (filesindir 0) still counted its specials */
    int n = tc.filesindir - specials + kept_count;
    return n > 0 ? n : 0;
}

bool library_tracks(void)
{
    if (pl_active)
        return pl_open >= 0;
    return tc.dirlevel > 0 && tagtree_get_attr(&tc) == FILE_ATTR_AUDIO;
}

/* Song lists formatted title 0x1F artist (pp_song in tagnavi_user.config).
 * Untagged files show their file name without one and sort anywhere, so
 * look past them. the first 32 rows; a list of only untagged files
 * stays one line. */
bool library_two_line(void)
{
    char name[128];
    if (pl_active)
        return pl_open >= 0;
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
    if (pl_active)
        return pl_open < 0 ? 1 : 2;
    return tc.dirlevel;
}

int library_selected(void)
{
    if (pl_active)
        return pl_open < 0 ? pl_last : 0;
    return visible_row(tc.selected_item);
}

void library_title(char *buf, size_t size)
{
    if (pl_active) {
        if (pl_open < 0)
            strmemccpy(buf, "Playlists", size);
        else
            strip_ext(buf, size, pl_names[pl_open]);
        return;
    }
    strmemccpy(buf, tc.dirlevel > 0 ? tagtree_get_title(&tc) : "Music", size);
}

void library_row(int index, char *buf, size_t size)
{
    buf[0] = '\0';
    if (index < 0 || index >= library_count())
        return;
    if (pl_active) {
        if (pl_open < 0)
            strip_ext(buf, size, pl_names[index]);
        else
            pl_song_row(index, buf, size);
        return;
    }
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
    if (pl_active) {
        if (pl_open < 0) {
            pl_open = pl_last = index;
            pl_index_songs();
            return LIBRARY_ENTERED;
        }
        if (playlist_create(PLAYLIST_DIR, pl_names[pl_open]) < 0)
            return LIBRARY_STAYED;
        playlist_start(index, 0, 0);
        return LIBRARY_PLAYING;
    }
    tc.selected_item = tree_row(index);
    /* 2: a track was picked and its list now plays from it (tree.c) */
    if (tagtree_enter(&tc, true) == 2)
        return LIBRARY_PLAYING;
    library_load();
    return LIBRARY_ENTERED;
}

bool library_back(void)
{
    if (pl_active) {
        if (pl_open < 0)
            return false;
        pl_open = -1;
        return true;
    }
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
