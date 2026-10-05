// Now Playing, the shell's main screen: status bar (date; play state, time,
// battery), rounded cover with a shadow, title / artist / album beside it,
// quality badge, times above a full-width scrubber. No on-screen transport:
// Play/Prev/Next are hardware keys. Nothing playing: big clock.

import { Show } from "solid-js";
import { AxisHandler, For, Image, Text, View } from "@pocketjs/framework/solid/components";
import { onMount } from "@pocketjs/framework/solid/lifecycle";
import {
  album, art, artBottom, artTop, artist, badge, batteryPx, date, elapsed, hasTrack,
  paused, poll, progressPx, remaining, time, title, titleFits, titleOffset,
  volumeLevel, volumeLitPx, volumeSegments, volumeShown, wheel,
} from "./app";

export default function NowPlaying() {
  onMount(poll);
  return (
    <View
      class="w-full h-full bg-gradient-to-b from-[#5b6270] to-[#16181c] overflow-hidden"
      style={{ gradFrom: artTop(), gradTo: artBottom() }}
    >
      <AxisHandler axis="primary" onDelta={(delta) => wheel(delta)} />
      {/* Dims the art-derived gradient so white text stays readable. */}
      <View class="absolute inset-0 bg-[#00000040]" />

      <View class="absolute top-0 left-0 right-0 h-[26] flex-row items-center justify-between px-[14]">
        {/* Left slot is always the screen's title; the date belongs to the idle clock. */}
        <Show when={hasTrack()}>
          <Text class="text-sm text-white font-bold">Now Playing</Text>
        </Show>
        <Show when={!hasTrack()}>
          <View />
        </Show>
        <View class="flex-row items-center gap-[5]">
          <Show when={hasTrack() && !paused()}>
            <Image src="icons/play_fill.svg" class="w-[12] h-[12]" />
          </Show>
          <Show when={hasTrack() && paused()}>
            <Image src="icons/pause_fill.svg" class="w-[12] h-[12]" />
          </Show>
          <Text class="text-sm text-white font-bold">{time()}</Text>
          {/* Framework7 battery outline with the level drawn inside it. */}
          <View class="w-[24] h-[12]">
            <Image src="icons/battery_0.svg" class="absolute top-0 left-0 w-[24] h-[12]" />
            <View class="absolute top-[3] left-[3] h-[6] rounded-[1px] bg-white" style={{ width: batteryPx() }} />
          </View>
        </View>
      </View>

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
          <Show when={titleFits()}>
            <Text class="text-xl text-white font-bold">{title()}</Text>
          </Show>
          <Show when={!titleFits()}>
            <View class="w-[146] h-[26] flex-row overflow-hidden">
              <View class="shrink-0 flex-row" style={{ translateX: -titleOffset() }}>
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

        <Show when={badge() !== ""}>
          <View class="absolute top-[172] left-[14] flex-row items-center gap-[3]">
            <Image src="icons/waveform.svg" class="w-[16] h-[16]" />
            <Text class="text-xs text-[#ffffffb3]">{badge()}</Text>
          </View>

          <View class="absolute top-[192] left-[16] right-[16] flex-row justify-between">
            <Text class="text-xs text-[#ffffffa6]">{elapsed()}</Text>
            <Text class="text-xs text-[#ffffffa6]">{remaining()}</Text>
          </View>
          <View class="absolute top-[212] left-[16] w-[288] h-[4] rounded-[2px] bg-[#ffffff40]">
            <View class="h-[4] rounded-[2px] bg-[#ffffffd9]" style={{ width: progressPx() }} />
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
            drives it. Floats over the content. */}
        <View class="absolute top-[184] left-[44] w-[232] h-[34] rounded-[17px] bg-[#1f1f21e0] flex-row items-center px-[14] gap-[10]">
          <Show when={volumeLevel() === 0}><Image src="icons/speaker_slash_fill.svg" class="w-[16] h-[16]" /></Show>
          <Show when={volumeLevel() === 1}><Image src="icons/speaker_1_fill.svg" class="w-[16] h-[16]" /></Show>
          <Show when={volumeLevel() === 2}><Image src="icons/speaker_2_fill.svg" class="w-[16] h-[16]" /></Show>
          <Show when={volumeLevel() === 3}><Image src="icons/speaker_3_fill.svg" class="w-[16] h-[16]" /></Show>
          <View class="w-[173] h-[3]">
            <View class="absolute top-0 left-0 flex-row gap-[3]">
              <For each={volumeSegments()} by={(i) => i}>
                {(_i) => <View class="w-[8] h-[3] rounded-[1px] bg-[#ffffff40]" />}
              </For>
            </View>
            <View class="absolute top-0 left-0 h-[3] flex-row gap-[3] overflow-hidden" style={{ width: volumeLitPx() }}>
              <For each={volumeSegments()} by={(i) => i}>
                {(_i) => <View class="w-[8] h-[3] rounded-[1px] bg-white shrink-0" />}
              </For>
            </View>
          </View>
        </View>
      </Show>
    </View>
  );
}
