// classicOS shell model. Polls the Rockbox host's playback and system
// services (hosts/rockbox answers them from C) and keeps flat signals the
// screens render.

import { createSignal } from "solid-js";
import { createMemo } from "@pocketjs/framework/solid/reactive";
import { after, idiv, imod, len, type Color, type i32 } from "@pocketjs/framework/solid/std";
import { playback } from "@pocketjs/framework/rockbox/playback/model";
import { system } from "@pocketjs/framework/rockbox/system/model";

export const [status, setStatus] = createSignal<string>("stopped");
export const [title, setTitle] = createSignal<string>("");
export const [titleWidth, setTitleWidth] = createSignal<i32>(0);
/** Marquee scroll offset of a title wider than TITLE_BOX, px */
export const [titleOffset, setTitleOffset] = createSignal<i32>(0);
export const [artist, setArtist] = createSignal<string>("");
export const [album, setAlbum] = createSignal<string>("");
export const [codec, setCodec] = createSignal<string>("");
export const [frequency, setFrequency] = createSignal<i32>(0);
export const [bitrate, setBitrate] = createSignal<i32>(0);
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

// One task (a component gets one onMount): ticks every 33 ms for the
// marquee and polls the host services every 8th tick (~4 Hz). MicroTS tasks
// need a bounded loop; this bound outlasts any battery.
export async function poll(): Promise<void> {
  for (let step: i32 = 0; step < 2147483647; step++) {
    marqueeTick();
    if (imod(step, 8) === 0) {
      const p = await playback.snapshot();
      if (p.kind === "ok") {
        setStatus(p.status);
        setTitle(p.title);
        setTitleWidth(p.titleWidth);
        setArtist(p.artist);
        setAlbum(p.album);
        setCodec(p.codec);
        setFrequency(p.frequency);
        setBitrate(p.bitrate);
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
    }
    await after(33);
  }
}

/** Title column width beside the art, px */
export const TITLE_BOX: i32 = 146;

// iOS-style marquee for titles wider than TITLE_BOX: the view renders the
// title twice, MARQUEE_GAP apart; scrolling by one title + gap lands on the
// second copy, so the loop restarts invisibly. Rests at the start, moves
// ~30 px/s. Advanced once per 33 ms tick by poll().
export const MARQUEE_GAP: i32 = 40;
const REST_TICKS: i32 = 60;
let marqueeTitle: string = "";
let marqueeRest: i32 = REST_TICKS;

function marqueeTick(): void {
  if (title() !== marqueeTitle) {
    marqueeTitle = title();
    marqueeRest = REST_TICKS;
    setTitleOffset(0);
  } else if (titleFits()) {
    return;
  } else if (marqueeRest > 0) {
    marqueeRest -= 1;
  } else if (titleOffset() < titleWidth() + MARQUEE_GAP) {
    setTitleOffset(titleOffset() + 1);
  } else {
    marqueeRest = REST_TICKS;
    setTitleOffset(0);
  }
}

function pad2(n: i32): string {
  return `${n < 10 ? "0" : ""}${n}`;
}

export const time = createMemo<string>(() => `${hour()}:${pad2(minute())}`);
export const date = createMemo<string>(() => `${WEEKDAYS[imod(weekday(), 7)]} ${day()} ${MONTHS[imod(month() - 1, 12)]}`);
export const hasTrack = createMemo<boolean>(() => status() !== "stopped");
export const titleFits = createMemo<boolean>(() => titleWidth() <= TITLE_BOX);
export const paused = createMemo<boolean>(() => status() === "paused");

function formatTime(ms: i32): string {
  const s = idiv(ms, 1000);
  return `${idiv(s, 60)}:${pad2(imod(s, 60))}`;
}
export const elapsed = createMemo<string>(() => formatTime(elapsedMs()));
export const remaining = createMemo<string>(() => `-${formatTime(durationMs() - elapsedMs())}`);

const LOSSLESS: string[] = ["AIFF", "WAV", "WAVE64", "FLAC", "ALAC", "WV", "APE", "TTA", "SHN"];
function isLossless(name: string): boolean {
  for (let i: i32 = 0; i < len(LOSSLESS); i++) {
    if (LOSSLESS[i] === name) return true;
  }
  return false;
}
/** Quality badge in Apple's wording; "" hides it. */
export const badge = createMemo<string>(() => {
  if (codec() === "") return "";
  if (isLossless(codec())) return frequency() > 48000 ? "Hi-Res Lossless" : "Lossless";
  return bitrate() > 0 ? `${codec()} ${bitrate()} kbps` : codec();
});
/** Battery fill in px inside the 24 px battery outline (16 px interior). */
export const batteryPx = createMemo<i32>(() => idiv(battery() * 16, 100));
/** Progress bar width in px for a 288 px track. */
export const progressPx = createMemo<i32>(() => (durationMs() > 0 ? idiv(elapsedMs() * 288, durationMs()) : 0));
