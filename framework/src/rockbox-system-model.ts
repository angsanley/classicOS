/** Rockbox system state as a typed MicroTS model service. Battery and storage
 * follow the PocketRock Host ABI 10 `system` snapshot; the clock fields are
 * classicOS additions for lock and status screens. */
import type { i32 } from "./numeric-microts.ts";

export type SystemResult =
  | {
      kind: "ok";
      batteryPercent: i32;
      charging: boolean;
      /** Local time from the RTC. weekday: 0 = Sunday, month: 1-12 */
      hour: i32;
      minute: i32;
      weekday: i32;
      day: i32;
      month: i32;
      /** Backlight level and its range; backlight timeout in s, 0 = always on */
      brightness: i32;
      brightnessMin: i32;
      brightnessMax: i32;
      backlight: i32;
      /** Piezo click on wheel steps and presses */
      clicker: boolean;
    }
  | { kind: "unavailable" } | { kind: "busy" } | { kind: "malformed" };

const MODULE = "@pocketjs/framework/rockbox/system/model";
const call = (name: string): PromiseLike<SystemResult> =>
  ({ kind: "service", service: MODULE, call: name, args: [] }) as unknown as PromiseLike<SystemResult>;

export type AboutResult =
  | { kind: "ok"; version: string; diskMb: i32; freeMb: i32 }
  | { kind: "unavailable" } | { kind: "busy" } | { kind: "malformed" };

/** A setting as applied (clamped) by the host */
export type SetResult =
  | { kind: "ok"; value: i32 }
  | { kind: "unavailable" } | { kind: "busy" } | { kind: "malformed" };

function about(): PromiseLike<AboutResult> {
  return { kind: "service", service: MODULE, call: "about", args: [] } as unknown as PromiseLike<AboutResult>;
}
/** Sets the backlight level; saved when the disk next spins down. */
function setBrightness(level: i32): PromiseLike<SetResult> {
  return { kind: "service", service: MODULE, call: "setBrightness", args: [level] } as unknown as PromiseLike<SetResult>;
}
/** Sets the backlight timeout in seconds, 0 = always on; saved like brightness. */
function setBacklight(seconds: i32): PromiseLike<SetResult> {
  return { kind: "service", service: MODULE, call: "setBacklight", args: [seconds] } as unknown as PromiseLike<SetResult>;
}

/** Turns the piezo clicker on (1) or off (0); saved like brightness. */
function setClicker(on: i32): PromiseLike<SetResult> {
  return { kind: "service", service: MODULE, call: "setClicker", args: [on] } as unknown as PromiseLike<SetResult>;
}

export type MeasureResult =
  | { kind: "ok"; width: i32 }
  | { kind: "unavailable" } | { kind: "busy" } | { kind: "malformed" };

/** Width in px of `text` in a baked font slot (fontSlotFor in
 * framework/compiler/tailwind.ts: 0-6 regular 12-36 px, 7-13 bold). */
function measure(text: string, slot: i32): PromiseLike<MeasureResult> {
  return { kind: "service", service: MODULE, call: "measure", args: [text, slot] } as unknown as PromiseLike<MeasureResult>;
}

export const system = {
  snapshot: () => call("snapshot"),
  measure,
  about,
  setBrightness,
  setBacklight,
  setClicker,
};
