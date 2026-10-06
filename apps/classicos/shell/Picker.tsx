// A four-option Settings page (Backlight, Clicker). The checkmark marks the
// current value; Select picks the selected row and goes back, Menu goes back
// unchanged.

import { Show } from "solid-js";
import { ActionHandler, AxisHandler, Image, View } from "@pocketjs/framework/solid/components";
import { BTN } from "@pocketjs/framework/input";
import type { i32 } from "@pocketjs/framework/solid/std";
import MenuRow from "./MenuRow.tsx";
import StatusBar from "./StatusBar.tsx";

export default function Picker(props: {
  title: string;
  /** Row labels, top to bottom */
  label0: string;
  label1: string;
  label2: string;
  label3: string;
  selected: i32;
  /** Row of the current value, -1 if none matches */
  current: i32;
  status: string;
  time: string;
  batteryPx: i32;
  plugged: boolean;
  onWheel: (delta: i32) => void;
  onSelect: () => void;
  onBack: () => void;
}) {
  return (
    <View class="w-full h-full bg-[#f2f2f7]">
      <AxisHandler axis="primary" onDelta={(delta) => props.onWheel(delta)} />
      <ActionHandler button={BTN.CIRCLE} latched onPress={() => props.onSelect()} />
      <ActionHandler button={BTN.CROSS} latched onPress={() => props.onBack()} />
      <StatusBar title={props.title} lock={false} dark status={props.status} time={props.time} clock batteryPx={props.batteryPx} plugged={props.plugged} />
      <View class="absolute top-[34] left-[12] w-[296] flex-col gap-[4]">
        <MenuRow selected={props.selected} index={0} label={props.label0} subtitle="" subtitleFits subtitleOffset={0} value="">
          <View class="w-[24] h-[24] items-center justify-center">
            <Show when={props.current === 0}>
              <Image src="icons/check.svg" class="w-[16] h-[16]" />
            </Show>
          </View>
        </MenuRow>
        <MenuRow selected={props.selected} index={1} label={props.label1} subtitle="" subtitleFits subtitleOffset={0} value="">
          <View class="w-[24] h-[24] items-center justify-center">
            <Show when={props.current === 1}>
              <Image src="icons/check.svg" class="w-[16] h-[16]" />
            </Show>
          </View>
        </MenuRow>
        <MenuRow selected={props.selected} index={2} label={props.label2} subtitle="" subtitleFits subtitleOffset={0} value="">
          <View class="w-[24] h-[24] items-center justify-center">
            <Show when={props.current === 2}>
              <Image src="icons/check.svg" class="w-[16] h-[16]" />
            </Show>
          </View>
        </MenuRow>
        <MenuRow selected={props.selected} index={3} label={props.label3} subtitle="" subtitleFits subtitleOffset={0} value="">
          <View class="w-[24] h-[24] items-center justify-center">
            <Show when={props.current === 3}>
              <Image src="icons/check.svg" class="w-[16] h-[16]" />
            </Show>
          </View>
        </MenuRow>
      </View>
    </View>
  );
}
