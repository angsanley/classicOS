// Root: runs the model's poll loop and mounts the current screen. Now
// Playing, the main screen, is inline here since it renders most of the
// model; other screens are components fed by props.
//
// Now Playing: status bar, rounded cover with a shadow, title / artist /
// album beside it, a full-width scrubber with times and the quality badge
// below. No on-screen transport: Play/Prev/Next are hardware keys. Nothing
// playing: big clock.

import { Match, Show, Switch } from "solid-js";
import { ActionHandler, AxisHandler, Image, Text, View } from "@pocketjs/framework/solid/components";
import { BTN } from "@pocketjs/framework/input";
import { onMount } from "@pocketjs/framework/solid/lifecycle";
import {
  available, back, backlightIndex, backlightLabel, backlightOption, backlightSelect, backlightWheel,
  batteryText, brightnessPx, clicker, brightnessWheel, capacity, settingsIndex, settingsSelect, settingsWheel, version,
  album, art, artBottom, artTop, artist, badge, batteryPx, date, elapsed, hasTrack,
  homeIndex, homeSelect, homeWheel, musicIndex, musicScroll, musicSelect, musicWheel, nowPlayingLine, openHome, poll, progressPx,
  remaining, screen, status, time, title, marqueeFits, marqueeOffset,
  volumeLevel, volumeLitPx, volumeShown, wheel,
} from "./app";
import Home from "./Home.tsx";
import Music from "./Music.tsx";
import About from "./About.tsx";
import Backlight from "./Backlight.tsx";
import Brightness from "./Brightness.tsx";
import Settings from "./Settings.tsx";
import StatusBar from "./StatusBar.tsx";

export default function Shell() {
  onMount(poll);
  return (
    <Switch>
      <Match when={screen() === "home"}>
        <Home
          selected={homeIndex()}
          nowPlaying={nowPlayingLine()} hasArt={art() !== ""}
          lineFits={marqueeFits()} lineOffset={marqueeOffset()}
          status={status()} time={time()} batteryPx={batteryPx()}
          onWheel={(delta) => homeWheel(delta)} onSelect={() => homeSelect()}
        />
      </Match>
      <Match when={screen() === "music"}>
        <Music
          selected={musicIndex()} scroll={musicScroll()}
          status={status()} time={time()} batteryPx={batteryPx()}
          onWheel={(delta) => musicWheel(delta)} onSelect={() => musicSelect()} onBack={() => back()}
        />
      </Match>
      <Match when={screen() === "settings"}>
        <Settings
          selected={settingsIndex()} backlight={backlightLabel()} clicker={clicker()}
          status={status()} time={time()} batteryPx={batteryPx()}
          onWheel={(delta) => settingsWheel(delta)} onSelect={() => settingsSelect()} onBack={() => back()}
        />
      </Match>
      <Match when={screen() === "brightness"}>
        <Brightness
          fillPx={brightnessPx()}
          status={status()} time={time()} batteryPx={batteryPx()}
          onWheel={(delta) => brightnessWheel(delta)} onBack={() => back()}
        />
      </Match>
      <Match when={screen() === "backlight"}>
        <Backlight
          selected={backlightIndex()} current={backlightOption()}
          status={status()} time={time()} batteryPx={batteryPx()}
          onWheel={(delta) => backlightWheel(delta)} onSelect={() => backlightSelect()} onBack={() => back()}
        />
      </Match>
      <Match when={screen() === "about"}>
        <About
          version={version()} capacity={capacity()} available={available()} battery={batteryText()}
          status={status()} time={time()} batteryPx={batteryPx()}
          onBack={() => back()}
        />
      </Match>
      <Match when={screen() === "now"}>
        <View
          class="w-full h-full bg-gradient-to-b from-[#5b6270] to-[#16181c] overflow-hidden"
          style={{ gradFrom: artTop(), gradTo: artBottom() }}
        >
          <AxisHandler axis="primary" onDelta={(delta) => wheel(delta)} />
          <ActionHandler button={BTN.CROSS} latched onPress={() => openHome()} />
          {/* Dims the art-derived gradient so white text stays readable. */}
          <View class="absolute inset-0 bg-[#00000040]" />

          <StatusBar title={hasTrack() ? "Now Playing" : ""} dark={false} status={status()} time={time()} clock={hasTrack()} batteryPx={batteryPx()} />

          <Show when={hasTrack()}>
            {/* Radius matches the 14 px corners baked into the art (ART_RADIUS). */}
            <View class="absolute top-[34] left-[16] w-[128] h-[128] rounded-[14px] bg-[#8a8d93] shadow-lg items-center justify-center">
              <Image src="icons/music_note_2.svg" class="w-[40] h-[40]" />
            </View>
            <Show when={art() !== ""}>
              {/* The host swaps in the current track's art texture with rounded
                  corners baked in (src is a build-time placeholder; MicroTS needs
                  a literal). */}
              <View debugName="AlbumArt" class="absolute top-[34] left-[16] w-[128] h-[128]">
                <Image src="art.png" class="w-[128] h-[128]" />
              </View>
            </Show>

            <View class="absolute top-[34] left-[158] w-[146] h-[128] flex-col justify-center">
              <Show when={marqueeFits()}>
                <Text class="text-xl text-white font-bold">{title()}</Text>
              </Show>
              <Show when={!marqueeFits()}>
                <View class="w-[146] h-[26] flex-row overflow-hidden">
                  <View class="shrink-0 flex-row" style={{ translateX: -marqueeOffset() }}>
                    <Text class="text-xl text-white font-bold">{title()}</Text>
                    <View class="w-[40]" />
                    <Text class="text-xl text-white font-bold">{title()}</Text>
                  </View>
                </View>
              </Show>
              <View class="w-[146] h-[18] overflow-hidden">
                <Text class="text-sm text-[#ffffffbf]">{artist()}</Text>
              </View>
              <View class="w-[146] h-[18] overflow-hidden">
                <Text class="text-sm text-[#ffffff99]">{album()}</Text>
              </View>
            </View>

            {/* Apple Music layout: scrubber, then elapsed · quality badge · remaining. */}
            <View class="absolute top-[194] left-[16] w-[288] h-[4] rounded-[2px] bg-[#ffffff40]">
              <View class="h-[4] rounded-[2px] bg-[#ffffffd9]" style={{ width: progressPx() }} />
            </View>
            <View class="absolute top-[204] left-[16] right-[16] flex-row justify-between">
              <Text class="text-xs text-[#ffffffa6]">{elapsed()}</Text>
              <Text class="text-xs text-[#ffffffa6]">{remaining()}</Text>
            </View>
            <Show when={badge() !== ""}>
              <View class="absolute top-[203] left-0 right-0 flex-row items-center justify-center gap-[3]">
                <Image src="icons/waveform.svg" class="w-[16] h-[16]" />
                <Text class="text-xs text-[#ffffffa6]">{badge()}</Text>
              </View>
            </Show>
          </Show>

          <Show when={!hasTrack()}>
            <View class="absolute inset-0 flex-col items-center justify-center">
              <Text class="text-sm text-[#d8dbe0] font-bold">{date()}</Text>
              <Text class="text-5xl text-white font-bold">{time()}</Text>
            </View>
          </Show>
          <Show when={volumeShown()}>
            {/* Volume HUD (macOS style): an indicator, not a slider; the wheel
                drives it. Floats over the content; kept to a few nodes and opaque
                since PocketJS rebuilds the draw list every frame. */}
            <View class="absolute top-[184] left-[44] w-[232] h-[34] rounded-[17px] bg-[#1f1f21] flex-row items-center px-[14] gap-[10]">
              <Show when={volumeLevel() === 0}><Image src="icons/speaker_slash_fill.svg" class="w-[16] h-[16]" /></Show>
              <Show when={volumeLevel() === 1}><Image src="icons/speaker_1_fill.svg" class="w-[16] h-[16]" /></Show>
              <Show when={volumeLevel() === 2}><Image src="icons/speaker_2_fill.svg" class="w-[16] h-[16]" /></Show>
              <Show when={volumeLevel() === 3}><Image src="icons/speaker_3_fill.svg" class="w-[16] h-[16]" /></Show>
              <View class="w-[176] h-[4] rounded-[2px] bg-[#ffffff40]">
                <View class="h-[4] rounded-[2px] bg-white" style={{ width: volumeLitPx() }} />
              </View>
            </View>
          </Show>
        </View>
      </Match>
    </Switch>
  );
}
