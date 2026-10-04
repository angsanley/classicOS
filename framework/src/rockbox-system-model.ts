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

export const system = {
  snapshot: () => call("snapshot"),
};
