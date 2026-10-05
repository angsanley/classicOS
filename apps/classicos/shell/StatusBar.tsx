// Status bar shared by every screen: the screen's title on the left; play
// state, time and battery on the right. `dark` = dark text and glyphs for
// light screens.

import { Show } from "solid-js";
import { Image, Text, View } from "@pocketjs/framework/solid/components";
import type { i32 } from "@pocketjs/framework/solid/std";

export default function StatusBar(props: {
  title: string;
  dark: boolean;
  /** "playing", "paused" or "stopped" */
  status: string;
  time: string;
  /** false while the screen shows its own big clock */
  clock: boolean;
  /** Battery level fill inside the outline, 0-16 px */
  batteryPx: i32;
}) {
  return (
    <View class="absolute top-0 left-0 right-0 h-[26] flex-row items-center justify-between px-[14]">
      {/* flex-1 holds the right group in place when the title is empty. */}
      <View class="flex-1">
        <Text class={props.dark ? "text-sm text-[#1a1a1a] font-bold" : "text-sm text-white font-bold"}>{props.title}</Text>
      </View>
      <View class="flex-row items-center gap-[5]">
        <Show when={props.status === "playing" && props.dark}>
          <Image src="icons/play_fill_dark.svg" class="w-[12] h-[12]" />
        </Show>
        <Show when={props.status === "playing" && !props.dark}>
          <Image src="icons/play_fill.svg" class="w-[12] h-[12]" />
        </Show>
        <Show when={props.status === "paused" && props.dark}>
          <Image src="icons/pause_fill_dark.svg" class="w-[12] h-[12]" />
        </Show>
        <Show when={props.status === "paused" && !props.dark}>
          <Image src="icons/pause_fill.svg" class="w-[12] h-[12]" />
        </Show>
        <Show when={props.clock}>
          <Text class={props.dark ? "text-sm text-[#1a1a1a] font-bold" : "text-sm text-white font-bold"}>{props.time}</Text>
        </Show>
        {/* Framework7 battery outline with the level drawn inside it. */}
        <View class="w-[24] h-[12]">
          <Show when={props.dark}>
            <Image src="icons/battery_0_dark.svg" class="absolute top-0 left-0 w-[24] h-[12]" />
          </Show>
          <Show when={!props.dark}>
            <Image src="icons/battery_0.svg" class="absolute top-0 left-0 w-[24] h-[12]" />
          </Show>
          <View class={props.dark ? "absolute top-[3] left-[3] h-[6] rounded-[1px] bg-[#1a1a1a]" : "absolute top-[3] left-[3] h-[6] rounded-[1px] bg-white"} style={{ width: props.batteryPx }} />
        </View>
      </View>
    </View>
  );
}
