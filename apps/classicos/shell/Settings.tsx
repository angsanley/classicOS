// Settings: Brightness, Backlight, Clicker, Update Library and About.
// Select opens a row (Update Library starts a rescan); Menu goes back to the
// drawer.

import { ActionHandler, AxisHandler, Image, View } from "@pocketjs/framework/solid/components";
import { BTN } from "@pocketjs/framework/input";
import type { i32 } from "@pocketjs/framework/solid/std";
import MenuRow from "./MenuRow.tsx";
import StatusBar from "./StatusBar.tsx";

export default function Settings(props: {
  selected: i32;
  /** List scroll in px */
  scroll: i32;
  backlight: string;
  clicker: string;
  /** Update Library was just started */
  updating: boolean;
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
      <StatusBar title="Settings" lock={false} dark status={props.status} time={props.time} clock batteryPx={props.batteryPx} plugged={props.plugged} />
      <View class="absolute top-[30] left-[12] w-[296] h-[210] overflow-hidden">
        <View class="absolute top-0 left-0 w-[296] flex-col gap-[4]" style={{ translateY: -props.scroll }}>
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
          <MenuRow selected={props.selected} index={2} label="Clicker" subtitle="" subtitleFits subtitleOffset={0} value={props.clicker}>
            <View class="w-[28] h-[28] rounded-full bg-[#ff2d55] items-center justify-center">
              <Image src="icons/speaker_2_fill.svg" class="w-[16] h-[16]" />
            </View>
          </MenuRow>
          <MenuRow selected={props.selected} index={3} label="Update Library" subtitle={props.updating ? "Updating in background" : ""} subtitleFits subtitleOffset={0} value="">
            <View class="w-[28] h-[28] rounded-full bg-[#34c759] items-center justify-center">
              <Image src="icons/tile_update.svg" class="w-[16] h-[16]" />
            </View>
          </MenuRow>
          <MenuRow selected={props.selected} index={4} label="About" subtitle="" subtitleFits subtitleOffset={0} value="">
            <View class="w-[28] h-[28] rounded-full bg-[#8e8e93] items-center justify-center">
              <Image src="icons/tile_about.svg" class="w-[16] h-[16]" />
            </View>
          </MenuRow>
        </View>
      </View>
    </View>
  );
}
