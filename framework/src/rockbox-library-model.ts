/** The Rockbox music database (tagcache) browsed like Rockbox's Database
 * menu (tagtree), as a typed MicroTS model service. The host keeps the
 * browse position; apps page rows in as they scroll (classicOS). */
import type { i32 } from "./numeric-microts.ts";

export type LevelResult =
  | {
      kind: "ok";
      /** "Music" at the top menu, else the opened row's name */
      title: string;
      count: i32;
      /** 0 = the top menu */
      depth: i32;
      /** Row to focus: 0 on a new list, the opened row after back() */
      selected: i32;
      /** enter() picked a song: its list now plays from it */
      playing: boolean;
    }
  /** The database is still building, or there is none */
  | { kind: "unavailable" } | { kind: "busy" } | { kind: "malformed" };

export type RowsResult =
  | { kind: "ok"; first: i32; rows: string[] }
  | { kind: "unavailable" } | { kind: "busy" } | { kind: "malformed" };

const MODULE = "@pocketjs/framework/rockbox/library/model";

function level(call: string, args: i32[]): PromiseLike<LevelResult> {
  return { kind: "service", service: MODULE, call, args } as unknown as PromiseLike<LevelResult>;
}

/** Up to 6 row names from `first` */
function rows(first: i32): PromiseLike<RowsResult> {
  return { kind: "service", service: MODULE, call: "rows", args: [first] } as unknown as PromiseLike<RowsResult>;
}

export const library = {
  /** Back to the top menu */
  open: () => level("open", []),
  /** Opens a row: a list, or a song, which plays */
  enter: (index: i32) => level("enter", [index]),
  /** Up one level (at the top menu it stays there) */
  back: () => level("back", []),
  rows,
};
