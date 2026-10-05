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
  /** On external power: a bolt over the battery and a green level */
  plugged: boolean;
}) {
  return (
    <View class="absolute top-0 left-0 right-0 h-[26] flex-row items-center justify-between pl-[14] pr-[10]">
      {/* flex-1 holds the right group in place when the title is empty. */}
      <View class="flex-1">
        <Text class={props.dark ? "text-sm text-[#1a1a1a] font-bold" : "text-sm text-white font-bold"}>{props.title}</Text>
      </View>
      {/* Icons are drawn 1:1 in power-of-two canvases with transparent margins
          (12 px glyphs in 16, the 24x12 battery in 32x16), so gaps look tighter. */}
      <View class="flex-row items-center gap-[3]">
        <Show when={props.status === "playing" && props.dark}>
          <Image src="icons/play_fill_dark.svg" class="w-[16] h-[16]" />
        </Show>
        <Show when={props.status === "playing" && !props.dark}>
          <Image src="icons/play_fill.svg" class="w-[16] h-[16]" />
        </Show>
        <Show when={props.status === "paused" && props.dark}>
          <Image src="icons/pause_fill_dark.svg" class="w-[16] h-[16]" />
        </Show>
        <Show when={props.status === "paused" && !props.dark}>
          <Image src="icons/pause_fill.svg" class="w-[16] h-[16]" />
        </Show>
        <Show when={props.clock}>
          <Text class={props.dark ? "text-sm text-[#1a1a1a] font-bold" : "text-sm text-white font-bold"}>{props.time}</Text>
        </Show>
        {/* Framework7 battery outline with the level drawn inside it; on power,
            a bolt in the battery's colour sits over it. */}
        <View class="w-[32] h-[16]">
          <Show when={props.dark}>
            <Image src="icons/battery_0_dark.svg" class="absolute top-0 left-0 w-[32] h-[16]" />
          </Show>
          <Show when={!props.dark}>
            <Image src="icons/battery_0.svg" class="absolute top-0 left-0 w-[32] h-[16]" />
          </Show>
          <View
            class={props.plugged
              ? "absolute top-[5] left-[7] h-[6] rounded-[1px] bg-[#34c759]"
              : props.dark ? "absolute top-[5] left-[7] h-[6] rounded-[1px] bg-[#1a1a1a]" : "absolute top-[5] left-[7] h-[6] rounded-[1px] bg-white"}
            style={{ width: props.batteryPx }}
          />
          <Show when={props.plugged && props.dark}>
            <Image src="icons/bolt_on_light.svg" class="absolute top-0 left-[7] w-[16] h-[16]" />
          </Show>
          <Show when={props.plugged && !props.dark}>
            <Image src="icons/bolt_on_dark.svg" class="absolute top-0 left-[7] w-[16] h-[16]" />
          </Show>
        </View>
      </View>
    </View>
  );
}
