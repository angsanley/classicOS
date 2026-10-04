// classicOS shell model. Polls the Rockbox host's playback and system
// services (hosts/rockbox answers them from C) and keeps flat signals the
// screens render.

import { createSignal } from "solid-js";
import { createMemo } from "@pocketjs/framework/solid/reactive";
import { after, idiv, imod, type Color, type i32 } from "@pocketjs/framework/solid/std";
import { playback } from "@pocketjs/framework/rockbox/playback/model";
import { system } from "@pocketjs/framework/rockbox/system/model";

export const [status, setStatus] = createSignal<string>("stopped");
export const [title, setTitle] = createSignal<string>("");
export const [artist, setArtist] = createSignal<string>("");
export const [elapsedMs, setElapsedMs] = createSignal<i32>(0);
export const [durationMs, setDurationMs] = createSignal<i32>(0);
export const [art, setArt] = createSignal<string>("");
export const [artTop, setArtTop] = createSignal<Color>("#5b6270");
export const [artBottom, setArtBottom] = createSignal<Color>("#16181c");
export const [hour, setHour] = createSignal<i32>(0);
export const [minute, setMinute] = createSignal<i32>(0);
export const [weekday, setWeekday] = createSignal<i32>(0);
export const [day, setDay] = createSignal<i32>(1);
export const [month, setMonth] = createSignal<i32>(1);
export const [battery, setBattery] = createSignal<i32>(100);

const WEEKDAYS: string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS: string[] = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// MicroTS tasks need a bounded loop; this bound outlasts any battery.
export async function poll(): Promise<void> {
  for (let step: i32 = 0; step < 2147483647; step++) {
    const p = await playback.snapshot();
    if (p.kind === "ok") {
      setStatus(p.status);
      setTitle(p.title);
      setArtist(p.artist);
      setElapsedMs(p.elapsedMs);
      setDurationMs(p.durationMs);
      setArt(p.art);
      setArtTop(p.art !== "" ? p.artTop : "#5b6270");
      setArtBottom(p.art !== "" ? p.artBottom : "#16181c");
    }
    const s = await system.snapshot();
    if (s.kind === "ok") {
      setHour(s.hour);
      setMinute(s.minute);
      setWeekday(s.weekday);
      setDay(s.day);
      setMonth(s.month);
      setBattery(s.batteryPercent);
    }
    await after(250);
  }
}

function pad2(n: i32): string {
  return `${n < 10 ? "0" : ""}${n}`;
}

export const time = createMemo<string>(() => `${hour()}:${pad2(minute())}`);
export const date = createMemo<string>(() => `${WEEKDAYS[imod(weekday(), 7)]} ${day()} ${MONTHS[imod(month() - 1, 12)]}`);
export const hasTrack = createMemo<boolean>(() => status() !== "stopped");
/** Progress bar width in px for a 268 px track. */
export const progressPx = createMemo<i32>(() => (durationMs() > 0 ? idiv(elapsedMs() * 268, durationMs()) : 0));
