// Control Center (hold Menu): a sheet over the dimmed current screen. Top:
// what's playing. Tiles: Volume, Shuffle, Repeat, Power Off; the wheel moves
// focus (a gray cell, a colour swap), Select acts and the label shows the new
// state. Power Off asks first. Menu (handled by the screen underneath, which
// calls back()) closes it.

import { Show } from "solid-js";
import { ActionHandler, AxisHandler, Image, Text, View } from "@pocketjs/framework/solid/components";
import { BTN } from "@pocketjs/framework/input";
import type { i32 } from "@pocketjs/framework/solid/std";

export default function ControlCenter(props: {
  title: string;
  artist: string;
  hasTrack: boolean;
  /** Focused tile: 0 Volume, 1 Shuffle, 2 Repeat, 3 Power Off */
  selected: i32;
  shuffle: boolean;
  /** 0 off, 1 all, 2 one */
  repeat: i32;
  shuffleLabel: string;
  repeatLabel: string;
  confirm: boolean;
  /** Confirm buttons: 0 Cancel, 1 Power Off */
  confirmIndex: i32;
  onWheel: (delta: i32) => void;
  onSelect: () => void;
}) {
  return (
    <View class="absolute inset-0">
      <AxisHandler axis="primary" onDelta={(delta) => props.onWheel(delta)} />
      <ActionHandler button={BTN.CIRCLE} latched onPress={() => props.onSelect()} />
      <View class="absolute inset-0 bg-[#00000059]" />
      <View class="absolute top-[70] left-[8] w-[304] h-[162] rounded-[20px] bg-[#f2f2f7] flex-col p-[12] gap-[10]">
        <View class="w-[280] h-[52] rounded-[12px] bg-white flex-row items-center px-[10] gap-[10]">
          <View class="w-[36] h-[36] rounded-[7px] bg-[#8a8d93]" />
          <View class="flex-1 flex-col overflow-hidden">
            <Text class="text-sm text-black font-bold">{props.hasTrack ? props.title : "Not Playing"}</Text>
            <Text class="text-xs text-[#6c6c70]">{props.hasTrack ? props.artist : ""}</Text>
          </View>
        </View>
        <Show when={!props.confirm}>
          <View class="w-[280] h-[76] flex-row">
            <View class={props.selected === 0 ? "w-[70] h-[76] rounded-[12px] bg-[#d1d1d6] flex-col items-center justify-center gap-[5]" : "w-[70] h-[76] rounded-[12px] bg-[#f2f2f7] flex-col items-center justify-center gap-[5]"}>
              <View class="w-[44] h-[44] rounded-full bg-white items-center justify-center">
                <Image src="icons/cc_volume.svg" class="w-[32] h-[32]" />
              </View>
              <Text class="text-xs text-[#3c3c43]">Volume</Text>
            </View>
            <View class={props.selected === 1 ? "w-[70] h-[76] rounded-[12px] bg-[#d1d1d6] flex-col items-center justify-center gap-[5]" : "w-[70] h-[76] rounded-[12px] bg-[#f2f2f7] flex-col items-center justify-center gap-[5]"}>
              <View class={props.shuffle ? "w-[44] h-[44] rounded-full bg-[#007aff] items-center justify-center" : "w-[44] h-[44] rounded-full bg-white items-center justify-center"}>
                <Show when={props.shuffle}><Image src="icons/cc_shuffle_on.svg" class="w-[32] h-[32]" /></Show>
                <Show when={!props.shuffle}><Image src="icons/cc_shuffle.svg" class="w-[32] h-[32]" /></Show>
              </View>
              <Text class="text-xs text-[#3c3c43]">{props.shuffleLabel}</Text>
            </View>
            <View class={props.selected === 2 ? "w-[70] h-[76] rounded-[12px] bg-[#d1d1d6] flex-col items-center justify-center gap-[5]" : "w-[70] h-[76] rounded-[12px] bg-[#f2f2f7] flex-col items-center justify-center gap-[5]"}>
              <View class={props.repeat !== 0 ? "w-[44] h-[44] rounded-full bg-[#007aff] items-center justify-center" : "w-[44] h-[44] rounded-full bg-white items-center justify-center"}>
                <Show when={props.repeat === 0}><Image src="icons/cc_repeat.svg" class="w-[32] h-[32]" /></Show>
                <Show when={props.repeat === 1}><Image src="icons/cc_repeat_on.svg" class="w-[32] h-[32]" /></Show>
                <Show when={props.repeat === 2}><Image src="icons/cc_repeat_1_on.svg" class="w-[32] h-[32]" /></Show>
              </View>
              <Text class="text-xs text-[#3c3c43]">{props.repeatLabel}</Text>
            </View>
            <View class={props.selected === 3 ? "w-[70] h-[76] rounded-[12px] bg-[#d1d1d6] flex-col items-center justify-center gap-[5]" : "w-[70] h-[76] rounded-[12px] bg-[#f2f2f7] flex-col items-center justify-center gap-[5]"}>
              <View class="w-[44] h-[44] rounded-full bg-white items-center justify-center">
                <Image src="icons/cc_power.svg" class="w-[32] h-[32]" />
              </View>
              <Text class="text-xs text-[#3c3c43]">Power Off</Text>
            </View>
          </View>
        </Show>
        <Show when={props.confirm}>
          <View class="w-[280] h-[76] flex-col items-center gap-[8]">
            <Text class="text-sm text-black font-bold">Power Off?</Text>
            <View class="w-[280] h-[44] flex-row gap-[8]">
              <View class={props.confirmIndex === 0 ? "w-[136] h-[44] rounded-[12px] bg-[#d1d1d6] items-center justify-center" : "w-[136] h-[44] rounded-[12px] bg-white items-center justify-center"}>
                <Text class="text-base text-black">Cancel</Text>
              </View>
              <View class={props.confirmIndex === 1 ? "w-[136] h-[44] rounded-[12px] bg-[#d1d1d6] items-center justify-center" : "w-[136] h-[44] rounded-[12px] bg-white items-center justify-center"}>
                <Text class="text-base text-[#ff3b30]">Power Off</Text>
              </View>
            </View>
          </View>
        </Show>
      </View>
    </View>
  );
}
