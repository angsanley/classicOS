// Full-screen Control Center shares Now Playing's album-art gradient.

import { Show } from "solid-js";
import { ActionHandler, AxisHandler, Image, Text, View } from "@pocketjs/framework/solid/components";
import { BTN } from "@pocketjs/framework/input";
import type { Color, i32 } from "@pocketjs/framework/solid/std";
import StatusBar from "./StatusBar.tsx";

export default function ControlCenter(props: {
  selected: i32;
  shuffle: boolean;
  repeat: i32;
  shuffleLabel: string;
  repeatLabel: string;
  artTop: Color;
  artBottom: Color;
  status: string;
  time: string;
  batteryPx: i32;
  plugged: boolean;
  onWheel: (delta: i32) => void;
  onSelect: () => void;
  onBack: () => void;
}) {
  return (
    <View class="w-full h-full bg-gradient-to-b from-[#5b6270] to-[#16181c] overflow-hidden" style={{ gradFrom: props.artTop, gradTo: props.artBottom }}>
      <AxisHandler axis="primary" onDelta={(delta) => props.onWheel(delta)} />
      <ActionHandler button={BTN.CIRCLE} latched onPress={() => props.onSelect()} />
      <ActionHandler button={BTN.CROSS} latched onPress={() => props.onBack()} />
      <View class="absolute inset-0 bg-[#00000040]" />
      <StatusBar title="Control Center" lock={false} dark={false} status={props.status} time={props.time} clock batteryPx={props.batteryPx} plugged={props.plugged} />

      {/* a near-transparent unfocused fill keeps draw operations stable. */}
      <View class="absolute top-[70] left-[14] w-[292] h-[88] flex-row gap-[8]">
        <View class={props.selected === 0 ? "w-[92] h-[88] rounded-[16px] bg-[#ffffff24] flex-col items-center pt-[8] gap-[8]" : "w-[92] h-[88] rounded-[16px] bg-[#ffffff03] flex-col items-center pt-[8] gap-[8]"}>
          <View class="w-[48] h-[48] rounded-full bg-[#ffffff2e] items-center justify-center">
            <Image src="icons/cc_volume_white.svg" class="w-[32] h-[32]" />
          </View>
          <Text class={props.selected === 0 ? "text-xs text-white" : "text-xs text-[#ffffffbf]"}>Volume</Text>
        </View>
        <View class={props.selected === 1 ? "w-[92] h-[88] rounded-[16px] bg-[#ffffff24] flex-col items-center pt-[8] gap-[8]" : "w-[92] h-[88] rounded-[16px] bg-[#ffffff03] flex-col items-center pt-[8] gap-[8]"}>
          <View class={props.shuffle ? "w-[48] h-[48] rounded-full bg-[#007aff] items-center justify-center" : "w-[48] h-[48] rounded-full bg-[#ffffff2e] items-center justify-center"}>
            <Image src="icons/cc_shuffle_on.svg" class="w-[32] h-[32]" />
          </View>
          <Text class={props.shuffle || props.selected === 1 ? "text-xs text-white" : "text-xs text-[#ffffffbf]"}>{props.shuffleLabel}</Text>
        </View>
        <View class={props.selected === 2 ? "w-[92] h-[88] rounded-[16px] bg-[#ffffff24] flex-col items-center pt-[8] gap-[8]" : "w-[92] h-[88] rounded-[16px] bg-[#ffffff03] flex-col items-center pt-[8] gap-[8]"}>
          <View class={props.repeat !== 0 ? "w-[48] h-[48] rounded-full bg-[#007aff] items-center justify-center" : "w-[48] h-[48] rounded-full bg-[#ffffff2e] items-center justify-center"}>
            <Show when={props.repeat !== 2}><Image src="icons/cc_repeat_on.svg" class="w-[32] h-[32]" /></Show>
            <Show when={props.repeat === 2}><Image src="icons/cc_repeat_1_on.svg" class="w-[32] h-[32]" /></Show>
          </View>
          <Text class={props.repeat !== 0 || props.selected === 2 ? "text-xs text-white" : "text-xs text-[#ffffffbf]"}>{props.repeatLabel}</Text>
        </View>
      </View>

      <View class={props.selected === 3 ? "absolute top-[180] left-[90] w-[140] h-[36] rounded-[18px] bg-[#ffffff4d] flex-row items-center justify-center gap-[1]" : "absolute top-[180] left-[90] w-[140] h-[36] rounded-[18px] bg-[#ffffff14] flex-row items-center justify-center gap-[1]"}>
        <View class="w-[32] h-[32]" style={{ opacity: props.selected === 3 ? 1 : 0.72 }}>
          <Image src="icons/cc_power.svg" class="w-[32] h-[32]" />
        </View>
        <Text class={props.selected === 3 ? "text-xs text-white" : "text-xs text-[#ffffffb8]"}>Power Off</Text>
      </View>
    </View>
  );
}
