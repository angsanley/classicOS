/* Music library (library.c): tagtree over the tagcache database */
#include <stdbool.h>
#include <stddef.h>

void library_init(void);

/** Back to the top menu, loaded; returns the row count or -1 while the
 * database isn't ready. */
int library_open(void);
/** Reloads the current level */
int library_load(void);
int library_count(void);
/** 0 = the top menu */
int library_depth(void);
/** The row to focus, restored when going back */
int library_selected(void);
void library_title(char *buf, size_t size);
void library_row(int index, char *buf, size_t size);

enum { LIBRARY_STAYED, LIBRARY_ENTERED, LIBRARY_PLAYING };
/** Opens a row: a list (LIBRARY_ENTERED) or a song, which plays its list
 * from there (LIBRARY_PLAYING). */
int library_enter(int index);
/** Up one level; false at the top menu */
bool library_back(void);
/** Rescans the music folder in the background */
void library_update(void);
