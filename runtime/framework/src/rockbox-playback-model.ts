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
      /** dB, within volumeMin..volumeMax (the codec's range) */
      volume: i32;
      volumeMin: i32;
      volumeMax: i32;
      shuffle: boolean;
      /** 0 off, 1 all, 2 one (classicOS) */
      repeat: i32;
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

export type VolumeResult =
  | { kind: "ok"; volume: i32 }
  | { kind: "unavailable" } | { kind: "busy" } | { kind: "malformed" };

const MODULE = "@pocketjs/framework/rockbox/playback/model";
const call = (name: string): PromiseLike<PlaybackResult> =>
  ({ kind: "service", service: MODULE, call: name, args: [] }) as unknown as PromiseLike<PlaybackResult>;

/** Sets the volume in dB; the host clamps it and returns the applied value. */
function setVolume(volume: i32): PromiseLike<VolumeResult> {
  return { kind: "service", service: MODULE, call: "setVolume", args: [volume] } as unknown as PromiseLike<VolumeResult>;
}

export type SettingResult =
  | { kind: "ok"; value: i32 }
  | { kind: "unavailable" } | { kind: "busy" } | { kind: "malformed" };

/** Shuffle on (1) or off (0), applied to the playing queue (classicOS) */
function setShuffle(on: i32): PromiseLike<SettingResult> {
  return { kind: "service", service: MODULE, call: "setShuffle", args: [on] } as unknown as PromiseLike<SettingResult>;
}

/** Repeat 0 off, 1 all, 2 one (classicOS) */
function setRepeat(mode: i32): PromiseLike<SettingResult> {
  return { kind: "service", service: MODULE, call: "setRepeat", args: [mode] } as unknown as PromiseLike<SettingResult>;
}

export const playback = {
  snapshot: () => call("snapshot"),
  setVolume,
  setShuffle,
  setRepeat,
};
