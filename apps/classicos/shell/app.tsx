// Lock screen. Playing: one-line clock, album art as a rounded square, and a
// card with title, artist and progress.
// Nothing playing: big clock. No on-screen transport: Play/Prev/Next are
// hardware keys.

import { Show } from "solid-js";
import { Image, Text, View } from "@pocketjs/framework/solid/components";
import { onMount } from "@pocketjs/framework/solid/lifecycle";
import { art, artBottom, artTop, artist, date, hasTrack, poll, progressPx, time, title } from "./app";

export default function Lock() {
  onMount(poll);
  return (
    <View
      class="w-full h-full bg-gradient-to-b from-[#5b6270] to-[#16181c] overflow-hidden"
      style={{ gradFrom: artTop(), gradTo: artBottom() }}
    >
      <Show when={hasTrack()}>
        <Show when={art() !== ""}>
          {/* The host swaps in the current track's art texture, with rounded
              corners baked in (src is a
              build-time placeholder; MicroTS needs a literal). */}
          <View debugName="AlbumArt" class="absolute top-[30] left-[96] w-[128] h-[128]">
            <Image src="art.png" class="w-[128] h-[128]" />
          </View>
        </Show>
        <View class="absolute top-[6] left-0 right-0 flex-row justify-center">
          <Text class="text-sm text-white font-bold">{`${time()}  ${date()}`}</Text>
        </View>
        <View class="absolute left-[12] right-[12] bottom-[12] h-[58] rounded-[18px] bg-[#25282e] flex-col items-center justify-center px-[14]">
          <Text class="text-sm text-white font-bold">{title()}</Text>
          <Text class="text-xs text-[#c4c7cc]">{artist()}</Text>
          <View class="w-[268] h-[3] mt-[6] rounded-[2px] bg-[#4a4e56]">
            <View class="h-[3] rounded-[2px] bg-white" style={{ width: progressPx() }} />
          </View>
        </View>
      </Show>
      <Show when={!hasTrack()}>
        <View class="absolute inset-0 flex-col items-center justify-center">
          <Text class="text-sm text-[#d8dbe0] font-bold">{date()}</Text>
          <Text class="text-5xl text-white font-bold">{time()}</Text>
        </View>
      </Show>
    </View>
  );
}
