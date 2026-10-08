// The volume HUD (macOS style): an indicator, not a slider; the wheel drives
// it. A dark capsule with the speaker glyph and a 16-segment level bar, over
// the bottom of the screen. Kept to a few opaque nodes.

import { Show } from "solid-js";
import { Image, View } from "@pocketjs/framework/solid/components";
import type { i32 } from "@pocketjs/framework/solid/std";

export default function VolumeHud(props: { level: i32; litPx: i32 }) {
  return (
    <View class="absolute top-[184] left-[44] w-[232] h-[34] rounded-[17px] bg-[#1f1f21] flex-row items-center px-[14] gap-[10]">
      <Show when={props.level === 0}><Image src="icons/speaker_slash_fill.svg" class="w-[16] h-[16]" /></Show>
      <Show when={props.level === 1}><Image src="icons/speaker_1_fill.svg" class="w-[16] h-[16]" /></Show>
      <Show when={props.level === 2}><Image src="icons/speaker_2_fill.svg" class="w-[16] h-[16]" /></Show>
      <Show when={props.level === 3}><Image src="icons/speaker_3_fill.svg" class="w-[16] h-[16]" /></Show>
      <View class="w-[176] h-[4] rounded-[2px] bg-[#ffffff40]">
        <View class="h-[4] rounded-[2px] bg-white" style={{ width: props.litPx }} />
      </View>
    </View>
  );
}
