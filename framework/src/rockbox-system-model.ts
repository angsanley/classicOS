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
    }
  | { kind: "unavailable" } | { kind: "busy" } | { kind: "malformed" };

const MODULE = "@pocketjs/framework/rockbox/system/model";
const call = (name: string): PromiseLike<SystemResult> =>
  ({ kind: "service", service: MODULE, call: name, args: [] }) as unknown as PromiseLike<SystemResult>;

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
};
