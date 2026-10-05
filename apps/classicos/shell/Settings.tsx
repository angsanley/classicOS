// Settings: Brightness, Backlight, Clicker and About. Select opens a row or
// flips Clicker; Menu goes back to Home.

import { ActionHandler, AxisHandler, Image, View } from "@pocketjs/framework/solid/components";
import { BTN } from "@pocketjs/framework/input";
import type { i32 } from "@pocketjs/framework/solid/std";
import MenuRow from "./MenuRow.tsx";
import StatusBar from "./StatusBar.tsx";
import Toggle from "./Toggle.tsx";

export default function Settings(props: {
  selected: i32;
  backlight: string;
  clicker: boolean;
  status: string;
  time: string;
  batteryPx: i32;
  onWheel: (delta: i32) => void;
  onSelect: () => void;
  onBack: () => void;
}) {
  return (
    <View class="w-full h-full bg-[#f2f2f7]">
      <AxisHandler axis="primary" onDelta={(delta) => props.onWheel(delta)} />
      <ActionHandler button={BTN.CIRCLE} latched onPress={() => props.onSelect()} />
      <ActionHandler button={BTN.CROSS} latched onPress={() => props.onBack()} />
      <StatusBar title="Settings" dark status={props.status} time={props.time} clock batteryPx={props.batteryPx} />
      <View class="absolute top-[34] left-[12] w-[296] flex-col gap-[4]">
        <MenuRow selected={props.selected} index={0} label="Brightness" subtitle="" subtitleFits subtitleOffset={0} value="">
          <View class="w-[28] h-[28] rounded-full bg-[#007aff] items-center justify-center">
            <Image src="icons/tile_brightness.svg" class="w-[16] h-[16]" />
          </View>
        </MenuRow>
        <MenuRow selected={props.selected} index={1} label="Backlight" subtitle="" subtitleFits subtitleOffset={0} value={props.backlight}>
          <View class="w-[28] h-[28] rounded-full bg-[#5856d6] items-center justify-center">
            <Image src="icons/tile_backlight.svg" class="w-[16] h-[16]" />
          </View>
        </MenuRow>
        <MenuRow selected={props.selected} index={2} label="Clicker" subtitle="" subtitleFits subtitleOffset={0} value="" trailing={<Toggle on={props.clicker} />}>
          <View class="w-[28] h-[28] rounded-full bg-[#ff2d55] items-center justify-center">
            <Image src="icons/speaker_2_fill.svg" class="w-[16] h-[16]" />
          </View>
        </MenuRow>
        <MenuRow selected={props.selected} index={3} label="About" subtitle="" subtitleFits subtitleOffset={0} value="">
          <View class="w-[28] h-[28] rounded-full bg-[#8e8e93] items-center justify-center">
            <Image src="icons/tile_about.svg" class="w-[16] h-[16]" />
          </View>
        </MenuRow>
      </View>
    </View>
  );
}
