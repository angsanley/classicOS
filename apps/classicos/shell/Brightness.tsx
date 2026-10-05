// Settings > Brightness: the wheel sets the backlight level live; Select or
// Menu goes back. A level bar between the dim and bright suns, no numbers.

import { ActionHandler, AxisHandler, Image, View } from "@pocketjs/framework/solid/components";
import { BTN } from "@pocketjs/framework/input";
import type { i32 } from "@pocketjs/framework/solid/std";
import StatusBar from "./StatusBar.tsx";

export default function Brightness(props: {
  /** Level bar fill, 0-220 px */
  fillPx: i32;
  status: string;
  time: string;
  batteryPx: i32;
  plugged: boolean;
  onWheel: (delta: i32) => void;
  onBack: () => void;
}) {
  return (
    <View class="w-full h-full bg-[#f2f2f7]">
      <AxisHandler axis="primary" onDelta={(delta) => props.onWheel(delta)} />
      <ActionHandler button={BTN.CIRCLE} latched onPress={() => props.onBack()} />
      <ActionHandler button={BTN.CROSS} latched onPress={() => props.onBack()} />
      <StatusBar title="Brightness" dark status={props.status} time={props.time} clock batteryPx={props.batteryPx} plugged={props.plugged} />
      <View class="absolute top-[26] left-0 right-0 bottom-0 flex-row items-center justify-center gap-[8]">
        <Image src="icons/sun_min.svg" class="w-[16] h-[16]" />
        <View class="w-[220] h-[6] rounded-[3px] bg-[#d1d1d6]">
          <View class="h-[6] rounded-[3px] bg-[#007aff]" style={{ width: props.fillPx }} />
        </View>
        <Image src="icons/sun_max.svg" class="w-[32] h-[32]" />
      </View>
    </View>
  );
}
