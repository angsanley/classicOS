// classicOS shell model. Polls the Rockbox host's playback and system
// services (hosts/rockbox answers them from C) and keeps flat signals the
// screens render.

import { createSignal } from "solid-js";
import { createMemo } from "@pocketjs/framework/solid/reactive";
import { after, cancel, idiv, imod, len, type Color, type i32 } from "@pocketjs/framework/solid/std";
import { playback } from "@pocketjs/framework/rockbox/playback/model";
import { system } from "@pocketjs/framework/rockbox/system/model";
import { library, type LevelResult } from "@pocketjs/framework/rockbox/library/model";

export const [status, setStatus] = createSignal<string>("stopped");
export const [title, setTitle] = createSignal<string>("");
/** Width of marqueeText() in px, from system.measure */
export const [marqueeWidth, setMarqueeWidth] = createSignal<i32>(0);
/** Scroll offset of marqueeText() when wider than its box, px */
export const [marqueeOffset, setMarqueeOffset] = createSignal<i32>(0);
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
/** On external power (charging or full) */
export const [plugged, setPlugged] = createSignal<boolean>(false);
/** Hold switch on: the Hold screen replaces whatever is shown */
export const [hold, setHold] = createSignal<boolean>(false);
/** Volume in dB and the codec's range, from the host */
export const [volume, setVolume] = createSignal<i32>(-25);
export const [volumeMin, setVolumeMin] = createSignal<i32>(-89);
export const [volumeMax, setVolumeMax] = createSignal<i32>(6);
export const [volumeShown, setVolumeShown] = createSignal<boolean>(false);
/** Display settings from the host: backlight level and range, timeout in s (0 = always on) */
export const [brightness, setBrightness] = createSignal<i32>(28);
export const [brightnessMin, setBrightnessMin] = createSignal<i32>(1);
export const [brightnessMax, setBrightnessMax] = createSignal<i32>(32);
export const [backlight, setBacklight] = createSignal<i32>(30);
/** Clicker outputs: 0 off, 1 speaker, 2 headphones, 3 both */
export const [clicker, setClicker] = createSignal<i32>(1);
/** Settings > About, fetched when About opens */
export const [version, setVersion] = createSignal<string>("");
export const [diskMb, setDiskMb] = createSignal<i32>(0);
export const [freeMb, setFreeMb] = createSignal<i32>(0);
/** Tracks in the music database, -1 while it is not ready */
export const [songs, setSongs] = createSignal<i32>(-1);

const WEEKDAYS: string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS: string[] = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// One task (a component gets one onMount): steps the marquee, sends pending
// settings, polls playback every 8th step and system state (clock, battery,
// hold switch) every 2nd. MicroTS tasks need a bounded loop; this bound
// outlasts any battery.
export async function poll(): Promise<void> {
  for (let step: i32 = 0; step < 2147483647; step++) {
    marqueeTick();
    if (marqueeMeasured !== marqueeText()) {
      marqueeMeasured = marqueeText();
      const m = await system.measure(marqueeMeasured, MARQUEE_SLOT);
      if (m.kind === "ok" && marqueeMeasured === marqueeText()) setMarqueeWidth(m.width);
    }
    if (volumeSendIn > 0) volumeSendIn -= 1;
    if (volumePending && volumeSendIn === 0) {
      volumePending = false;
      volumeSendIn = VOLUME_SEND_TICKS;
      const v = await playback.setVolume(volume());
      // Ignore the reply if the wheel moved again meanwhile; it is stale.
      if (v.kind === "ok" && !volumePending) setVolume(v.volume);
    }
    if (brightnessPending) {
      brightnessPending = false;
      const b = await system.setBrightness(brightness());
      if (b.kind === "ok" && !brightnessPending) setBrightness(b.value);
    }
    if (backlightPending) {
      backlightPending = false;
      const t = await system.setBacklight(backlight());
      if (t.kind === "ok" && !backlightPending) setBacklight(t.value);
    }
    if (clickerPending) {
      clickerPending = false;
      const c = await system.setClicker(clicker());
      if (c.kind === "ok" && !clickerPending) setClicker(c.value);
    }
    if (updateWanted) {
      updateWanted = false;
      const u = await library.update();
      // A finished scan changes the lists; reload the open one on return.
      if (u.kind === "ok") rowsLoaded = -1;
    }
    if (aboutWanted) {
      aboutWanted = false;
      const a = await system.about();
      if (a.kind === "ok") {
        setVersion(a.version);
        setDiskMb(a.diskMb);
        setFreeMb(a.freeMb);
        setSongs(a.songs);
      }
    }
    // The database is still building: retry the list about once a second.
    if (screen() === "library" && !libraryReady() && libraryOp === 0 && imod(step, 30) === 0) libraryOp = LIBRARY_OPEN;
    if (libraryOp !== 0) await runLibraryOp();
    if (screen() === "library" && idiv(libraryScroll(), libraryPitch()) !== rowsLoaded) {
      // Label room in a GroupRow: 266 px, less the chevron and its gap
      const r = await library.rows(idiv(libraryScroll(), libraryPitch()), libraryTracks() ? 266 : 238);
      if (r.kind === "ok") {
        setLibraryRows(r.rows);
        setLibrarySubs(r.subs);
        setLibraryFirst(r.first);
        rowsLoaded = r.first;
      }
    }
    if (imod(step, 8) === 0) {
      const p = await playback.snapshot();
      if (p.kind === "ok") {
        setStatus(p.status);
        setTitle(p.title);
        setArtist(p.artist);
        setAlbum(p.album);
        setCodec(p.codec);
        setFrequency(p.frequency);
        setBitrate(p.bitrate);
        setVolumeMin(p.volumeMin);
        setVolumeMax(p.volumeMax);
        if (!volumePending) setVolume(p.volume);
        setElapsedMs(p.elapsedMs);
        setDurationMs(p.durationMs);
        setArt(p.art);
        setArtTop(p.art !== "" ? p.artTop : "#5b6270");
        setArtBottom(p.art !== "" ? p.artBottom : "#16181c");
      }
      leaveStoppedNowPlaying();
    }
    // System state every 2nd step (~150 ms) so the hold switch shows quickly.
    if (imod(step, 2) === 0) {
      const s = await system.snapshot();
      if (s.kind === "ok") {
        setHour(s.hour);
        setMinute(s.minute);
        setWeekday(s.weekday);
        setDay(s.day);
        setMonth(s.month);
        setBattery(s.batteryPercent);
        setPlugged(s.plugged);
        setHold(s.hold);
        setBrightnessMin(s.brightnessMin);
        setBrightnessMax(s.brightnessMax);
        if (!brightnessPending) setBrightness(s.brightness);
        if (!backlightPending) setBacklight(s.backlight);
        if (!clickerPending) setClicker(s.clicker);
      }
    }
    await after(33);
  }
}

/** Title column width beside the art, px */
export const TITLE_BOX: i32 = 146;

// iOS-style marquee for the one text on screen that may overflow (see
// marqueeText): the view renders it twice, MARQUEE_GAP apart; scrolling by one
// text + gap lands on the second copy, so the loop restarts invisibly. Rests
// 2 s at the start, then moves 1 px per poll() step.
export const MARQUEE_GAP: i32 = 40;
let marqueeShown: string = "";
let marqueeMeasured: string = "";
let marqueeResting: boolean = true;

async function restMarquee(): Promise<void> {
  marqueeResting = true;
  await after(2000);
  marqueeResting = false;
}

function marqueeTick(): void {
  if (marqueeText() !== marqueeShown) {
    marqueeShown = marqueeText();
    setMarqueeWidth(0);
    setMarqueeOffset(0);
    cancel(restMarquee);
    restMarquee();
  } else if (marqueeFits() || marqueeResting) {
    return;
  } else if (marqueeOffset() < marqueeWidth() + MARQUEE_GAP) {
    setMarqueeOffset(marqueeOffset() + 1);
  } else {
    setMarqueeOffset(0);
    restMarquee();
  }
}

// Wheel = volume on Now Playing: the overlay and the shown value update at
// once; poll() sends only the latest value, one request at a time (turns in
// between coalesce). hideVolume hides the overlay 2 s after the last turn.
/** The wheel axis reports millidegrees; one click is 15000
 * (WHEEL_STEP_MILLIDEGREES in pocketjs/hosts/rockbox/src/lib.rs). */
export const WHEEL_STEP: i32 = 15000;
/** The HUD's 16 segments map to the useful range: 0 = mute (codec
 * minimum), 1..16 = -60 dB up to 0 dB. One wheel click = one segment. */
const SEGMENTS: i32 = 16;
const USEFUL_MIN_DB: i32 = -60;

function segmentDb(seg: i32): i32 {
  return seg <= 0 ? volumeMin() : USEFUL_MIN_DB + idiv(seg * (0 - USEFUL_MIN_DB), SEGMENTS);
}
function dbSegment(db: i32): i32 {
  if (db <= volumeMin() || db <= USEFUL_MIN_DB) return 0;
  const seg = idiv((db - USEFUL_MIN_DB) * SEGMENTS + 30, 0 - USEFUL_MIN_DB);
  return seg > SEGMENTS ? SEGMENTS : seg;
}
let volumePending: boolean = false;
/** At most one codec write per 3 ticks (~100 ms) while turning; each is an
 * I2C transfer. The latest value is always sent once the wheel stops. */
const VOLUME_SEND_TICKS: i32 = 3;
let volumeSendIn: i32 = 0;

export function wheel(delta: i32): void {
  if (!hasTrack()) return;
  const next = dbSegment(volume()) + idiv(delta, WHEEL_STEP);
  setVolume(segmentDb(next < 0 ? 0 : next > SEGMENTS ? SEGMENTS : next));
  volumePending = true;
  setVolumeShown(true);
  cancel(hideVolume);
  hideVolume();
}

async function hideVolume(): Promise<void> {
  await after(2000);
  setVolumeShown(false);
}

function pad2(n: i32): string {
  return `${n < 10 ? "0" : ""}${n}`;
}

export const time = createMemo<string>(() => `${hour()}:${pad2(minute())}`);
export const date = createMemo<string>(() => `${WEEKDAYS[imod(weekday(), 7)]} ${day()} ${MONTHS[imod(month() - 1, 12)]}`);
/** Hold screen line under the title */
export const artistAlbum = createMemo<string>(() => (artist() !== "" && album() !== "" ? `${artist()} — ${album()}` : artist() !== "" ? artist() : album()));
export const hasTrack = createMemo<boolean>(() => status() !== "stopped");
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
/** Speaker glyph: 0 = muted, then 1-3 waves by thirds of the segments */
export const volumeLevel = createMemo<i32>(() => {
  const seg = dbSegment(volume());
  return seg === 0 ? 0 : seg <= 5 ? 1 : seg <= 10 ? 2 : 3;
});
/** Fill width of the HUD's 176 px level bar: 11 px per step */
export const volumeLitPx = createMemo<i32>(() => dbSegment(volume()) * 11);
export const batteryPx = createMemo<i32>(() => idiv(battery() * 16, 100));
/** Progress bar width in px for a 288 px track. */
export const progressPx = createMemo<i32>(() => (durationMs() > 0 ? idiv(elapsedMs() * 288, durationMs()) : 0));

// Screens and navigation. One screen is mounted at a time (the root's
// Switch unmounts the rest). The root is Now Playing while music plays and
// the app drawer otherwise; Menu goes back one level. Back targets are fixed
// until the library browser needs a stack.

/** "now", "drawer", "music", "library", "settings", "brightness", "backlight", "clicker" or "about" */
export const [screen, setScreen] = createSignal<string>("drawer");

/** Drawer apps, row-major in its 2x4 grid: Now Playing, Music, Settings */
const DRAWER_ITEMS: i32 = 3;
/** Selections are kept across visits so a screen reopens where it was. */
export const [drawerIndex, setDrawerIndex] = createSignal<i32>(0);
/** Music rows: Playlists, Artists, Albums, Songs */
const MUSIC_ITEMS: i32 = 4;
export const [musicIndex, setMusicIndex] = createSignal<i32>(0);
/** Library row height + separator, and the list's visible height below the
 * status bar */
const ROW_PITCH: i32 = 45;
const ROW_HEIGHT: i32 = 44;
const LIST_VIEW: i32 = 206;

/** Screens go back to Now Playing after this long untouched, if something plays. */
const IDLE_RETURN_MS: i32 = 30000;

async function idleReturn(): Promise<void> {
  await after(IDLE_RETURN_MS);
  if (hasTrack()) setScreen("now");
}

function go(to: string): void {
  setScreen(to);
  cancel(idleReturn);
  if (to !== "now") idleReturn();
}

/** Forward into a list: it starts at the top. Going back keeps its place. */
function open(to: string): void {
  if (to === "music") {
    setMusicIndex(0);
  } else if (to === "settings") {
    setSettingsIndex(0);
    setSettingsScroll(0);
  }
  go(to);
}

// Library lists behind Music's Artists, Albums and Songs: Rockbox's database
// browser (tagtree) runs in the host, menus from tagnavi_user.config.
// Actions queue a browse step; poll() runs it and pages in the rows around
// the scroll position.
export const [libraryIndex, setLibraryIndex] = createSignal<i32>(0);
export const [libraryScroll, setLibraryScroll] = createSignal<i32>(0);
export const [libraryTitle, setLibraryTitle] = createSignal<string>("Music");
export const [libraryCount, setLibraryCount] = createSignal<i32>(0);
/** False while the database is building (or missing) */
export const [libraryReady, setLibraryReady] = createSignal<boolean>(true);
/** A list is on its way; nothing to say about an empty one yet */
export const [libraryLoading, setLibraryLoading] = createSignal<boolean>(false);
/** Activity spinner frame, 0-7; steps every 125 ms while shown */
export const [spinnerFrame, setSpinnerFrame] = createSignal<i32>(0);

async function spin(): Promise<void> {
  for (let i: i32 = 0; i < 2147483647; i++) {
    await after(125);
    setSpinnerFrame(imod(spinnerFrame() + 1, 8));
  }
}
/** libraryRows() are rows libraryFirst() onwards */
export const [libraryFirst, setLibraryFirst] = createSignal<i32>(0);
export const [libraryRows, setLibraryRows] = createSignal<string[]>([]);
/** The list is songs: no chevrons, Select plays */
export const [libraryTracks, setLibraryTracks] = createSignal<boolean>(false);
/** Song rows with the artist under the title (librarySubs) */
export const [libraryTwoLine, setLibraryTwoLine] = createSignal<boolean>(false);
export const [librarySubs, setLibrarySubs] = createSignal<string[]>([]);
/** Row pitch: a 44 or 52 px row plus its hairline */
export const libraryPitch = createMemo<i32>(() => (libraryTwoLine() ? 53 : ROW_PITCH));
let libraryDepth: i32 = 0;
const LIBRARY_OPEN: i32 = 1;
const LIBRARY_ENTER: i32 = 2;
const LIBRARY_BACK: i32 = 3;
let libraryOp: i32 = 0;
/** LIBRARY_OPEN: the tagnavi menu row to open (Artists, Albums, Songs) */
let libraryRoot: i32 = 0;
/** Their titles, shown while the list loads */
const LIBRARY_ROOTS: string[] = ["Artists", "Albums", "Songs"];
/** First row of the loaded page, -1 = reload */
let rowsLoaded: i32 = -1;

async function runLibraryOp(): Promise<void> {
  const op = libraryOp;
  libraryOp = 0;
  if (op === LIBRARY_OPEN) {
    const top = await library.open();
    if (top.kind !== "ok") {
      applyLevel(top);
      return;
    }
    const l = await library.enter(libraryRoot);
    applyLevel(l);
  } else if (op === LIBRARY_ENTER) {
    const l = await library.enter(libraryIndex());
    applyLevel(l);
  } else {
    const l = await library.back();
    applyLevel(l);
  }
}

function applyLevel(l: LevelResult): void {
  setLibraryLoading(false);
  if (l.kind !== "ok") {
    setLibraryReady(false);
    setLibraryCount(0);
    return;
  }
  setLibraryReady(true);
  cancel(spin);
  if (l.playing) {
    go("now");
    return;
  }
  setLibraryTitle(l.title);
  setLibraryCount(l.count);
  setLibraryTracks(l.tracks);
  setLibraryTwoLine(l.twoLine);
  libraryDepth = l.depth;
  setLibraryIndex(l.selected);
  setLibraryScroll(scrollToTop(l.selected * libraryPitch(), 0, libraryPitch() - 1));
  rowsLoaded = -1;
}

function step(index: i32, delta: i32, count: i32): i32 {
  const next = index + idiv(delta, WHEEL_STEP);
  return next < 0 ? 0 : next >= count ? count - 1 : next;
}

/** Scroll that keeps row `index` in view, moving as little as possible */
function scrollTo(index: i32, scroll: i32): i32 {
  return scrollToTop(index * ROW_PITCH, scroll, ROW_HEIGHT);
}

/** Same, for a row `height` px tall whose top is at `top` */
function scrollToTop(top: i32, scroll: i32, height: i32): i32 {
  if (top < scroll) return top;
  if (top + height > scroll + LIST_VIEW) return top + height - LIST_VIEW;
  return scroll;
}

/** Menu on Now Playing */
export function openDrawer(): void {
  go("drawer");
}

export function drawerWheel(delta: i32): void {
  setDrawerIndex(step(drawerIndex(), delta, DRAWER_ITEMS));
  go("drawer");
}

export function drawerSelect(): void {
  // Now Playing with nothing loaded does nothing; an empty
  // "Not Playing" state can come later.
  if (drawerIndex() === 0) {
    if (hasTrack()) go("now");
  } else open(drawerIndex() === 1 ? "music" : "settings");
}

/** Leaves Now Playing for the drawer once the queue ends. Called per poll. */
function leaveStoppedNowPlaying(): void {
  if (screen() === "now" && !hasTrack()) go("drawer");
}

export function musicWheel(delta: i32): void {
  setMusicIndex(step(musicIndex(), delta, MUSIC_ITEMS));
  go("music");
}

/** Menu: Settings' pages go back to Settings, the apps to the drawer, and
 * the drawer to Now Playing while something plays. */
export function back(): void {
  const s = screen();
  if (s === "brightness" || s === "backlight" || s === "clicker" || s === "about") go("settings");
  else if (s === "library") {
    // The first level (Artists, Albums, Songs) goes back to Music.
    if (libraryDepth > 1) {
      libraryOp = LIBRARY_BACK;
      go("library");
    } else {
      cancel(spin);
      go("music");
    }
  } else if (s !== "drawer") go("drawer");
  else if (hasTrack()) go("now");
}

export function musicSelect(): void {
  // Playlists needs a playlist source (.m3u files) first
  if (musicIndex() === 0) {
    go("music");
    return;
  }
  libraryRoot = musicIndex() - 1;
  libraryOp = LIBRARY_OPEN;
  setLibraryTitle(LIBRARY_ROOTS[libraryRoot]);
  setLibraryIndex(0);
  setLibraryScroll(0);
  setLibraryCount(0);
  setLibraryLoading(true);
  rowsLoaded = -1;
  cancel(spin);
  spin();
  go("library");
}

export function libraryWheel(delta: i32): void {
  if (libraryCount() === 0) return;
  setLibraryIndex(step(libraryIndex(), delta, libraryCount()));
  setLibraryScroll(scrollToTop(libraryIndex() * libraryPitch(), libraryScroll(), libraryPitch() - 1));
  go("library");
}

export function librarySelect(): void {
  if (libraryCount() > 0) libraryOp = LIBRARY_ENTER;
  go("library");
}

/** The text the marquee drives: Now Playing's title, measured in font slot
 * 11 (text-xl bold; fontSlotFor in framework/compiler/tailwind.ts). */
export const marqueeText = createMemo<string>(() => (screen() === "now" ? title() : ""));
const MARQUEE_SLOT: i32 = 11;
export const marqueeFits = createMemo<boolean>(() => marqueeWidth() <= TITLE_BOX);

// Settings: Brightness (a level screen), Backlight and Clicker (pickers),
// Update Library (an action), About.
const SETTINGS_ITEMS: i32 = 5;
/** Row tops in the Settings list (Settings.tsx): 44 px rows, a 1 px
 * separator inside a group, 10 px between groups */
const SETTINGS_TOPS: i32[] = [0, 45, 99, 153, 207];
/** About scrolls by the wheel; its content is 287 px in a 210 px view */
export const [aboutScroll, setAboutScroll] = createSignal<i32>(0);
const ABOUT_MAX_SCROLL: i32 = 77;

export function aboutWheel(delta: i32): void {
  const next = aboutScroll() + idiv(delta, WHEEL_STEP) * 44;
  setAboutScroll(next < 0 ? 0 : next > ABOUT_MAX_SCROLL ? ABOUT_MAX_SCROLL : next);
  go("about");
}
export const [settingsIndex, setSettingsIndex] = createSignal<i32>(0);
export const [settingsScroll, setSettingsScroll] = createSignal<i32>(0);
/** Picker cursor on the Backlight page */
export const [backlightIndex, setBacklightIndex] = createSignal<i32>(0);
/** Backlight picker options in s, 0 = always on, and their labels */
const BACKLIGHT_SECONDS: i32[] = [10, 30, 60, 0];
const BACKLIGHT_LABELS: string[] = ["10 s", "30 s", "1 min", "Always"];
/** Clicker picker rows (Picker labels in app.tsx); the row index is the mode */
const CLICKER_ROWS: string[] = ["Off", "Speaker", "Headphones", "Both"];
export const [clickerIndex, setClickerIndex] = createSignal<i32>(0);
/** Brightness level bar width, px */
const BRIGHTNESS_BAR: i32 = 220;
let brightnessPending: boolean = false;
let backlightPending: boolean = false;
let clickerPending: boolean = false;
let aboutWanted: boolean = false;
let updateWanted: boolean = false;
/** Update Library was just started: its row says so for a few seconds,
 * as Rockbox's Update Now splash does */
export const [updateStarted, setUpdateStarted] = createSignal<boolean>(false);

async function updateNotice(): Promise<void> {
  setUpdateStarted(true);
  await after(3000);
  setUpdateStarted(false);
}

export function settingsWheel(delta: i32): void {
  setSettingsIndex(step(settingsIndex(), delta, SETTINGS_ITEMS));
  setSettingsScroll(scrollToTop(SETTINGS_TOPS[settingsIndex()], settingsScroll(), ROW_HEIGHT));
  go("settings");
}

export function settingsSelect(): void {
  if (settingsIndex() === 0) go("brightness");
  else if (settingsIndex() === 1) {
    setBacklightIndex(backlightOption());
    go("backlight");
  } else if (settingsIndex() === 2) {
    setClickerIndex(clicker());
    go("clicker");
  } else if (settingsIndex() === 3) {
    updateWanted = true;
    cancel(updateNotice);
    updateNotice();
    go("settings");
  } else {
    aboutWanted = true;
    setAboutScroll(0);
    go("about");
  }
}

/** One wheel click = one backlight level */
export function brightnessWheel(delta: i32): void {
  const next = brightness() + idiv(delta, WHEEL_STEP);
  setBrightness(next < brightnessMin() ? brightnessMin() : next > brightnessMax() ? brightnessMax() : next);
  brightnessPending = true;
  go("brightness");
}

export function backlightWheel(delta: i32): void {
  setBacklightIndex(step(backlightIndex(), delta, len(BACKLIGHT_SECONDS)));
  go("backlight");
}

export function backlightSelect(): void {
  setBacklight(BACKLIGHT_SECONDS[backlightIndex()]);
  backlightPending = true;
  go("settings");
}

export function clickerWheel(delta: i32): void {
  setClickerIndex(step(clickerIndex(), delta, len(CLICKER_ROWS)));
  go("clicker");
}

export function clickerSelect(): void {
  setClicker(clickerIndex());
  clickerPending = true;
  go("settings");
}

export const clickerLabel = createMemo<string>(() => CLICKER_ROWS[clicker()]);

/** Picker row of the current timeout, -1 for a value not in the list */
export const backlightOption = createMemo<i32>(() => {
  for (let i: i32 = 0; i < len(BACKLIGHT_SECONDS); i++) {
    if (BACKLIGHT_SECONDS[i] === backlight()) return i;
  }
  return -1;
});
export const backlightLabel = createMemo<string>(() => (backlightOption() >= 0 ? BACKLIGHT_LABELS[backlightOption()] : `${backlight()} s`));
export const brightnessPx = createMemo<i32>(() =>
  brightnessMax() > brightnessMin() ? idiv((brightness() - brightnessMin()) * BRIGHTNESS_BAR, brightnessMax() - brightnessMin()) : BRIGHTNESS_BAR,
);

function gigabytes(mb: i32): string {
  return `${idiv(mb, 1024)}.${idiv(imod(mb, 1024) * 10, 1024)} GB`;
}
/** "1,284"; "" while the database is not ready */
export const songsText = createMemo<string>(() => {
  const n = songs();
  if (n < 0) return "";
  if (n < 1000) return `${n}`;
  const rest = imod(n, 1000);
  return `${idiv(n, 1000)},${rest < 10 ? "00" : rest < 100 ? "0" : ""}${rest}`;
});
export const capacity = createMemo<string>(() => gigabytes(diskMb()));
export const available = createMemo<string>(() => gigabytes(freeMb()));
export const batteryText = createMemo<string>(() => `${battery()}%`);
