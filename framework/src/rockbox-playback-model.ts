/** Rockbox playback as a typed MicroTS model service. Field names follow the
 * PocketRock Host ABI 10 `playback` service so apps can move between hosts.
 * The embedding host answers requests (see hosts/rockbox). */
import type { Color, i32 } from "./numeric-microts.ts";

export type PlaybackResult =
  | {
      kind: "ok";
      /** "stopped" | "playing" | "paused" */
      status: string;
      index: i32;
      path: string;
      title: string;
      /** Rendered width of title in text-xl bold, px (classicOS) */
      titleWidth: i32;
      artist: string;
      album: string;
      elapsedMs: i32;
      durationMs: i32;
      volume: i32;
      shuffle: boolean;
      /** Rockbox format label ("FLAC", "MP3", "AAC"...), sample rate in Hz and
       * bitrate in kbps (classicOS) */
      codec: string;
      frequency: i32;
      bitrate: i32;
      /** Changes per album art, "" without art (classicOS) */
      art: string;
      /** Average colour of the art's top and bottom halves (classicOS) */
      artTop: Color;
      artBottom: Color;
    }
  | { kind: "unavailable" } | { kind: "busy" } | { kind: "malformed" };

const MODULE = "@pocketjs/framework/rockbox/playback/model";
const call = (name: string): PromiseLike<PlaybackResult> =>
  ({ kind: "service", service: MODULE, call: name, args: [] }) as unknown as PromiseLike<PlaybackResult>;

export const playback = {
  snapshot: () => call("snapshot"),
};
