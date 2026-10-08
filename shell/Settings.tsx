// Settings, CarPlay/iOS style: grouped lists (Display, Sounds, Library,
// About) with rounded-square icon tiles. Rows are indexed 0-4 top to bottom
// (SETTINGS_TOPS in app.ts holds their y). Select opens a row (Update Library
// starts a rescan); Menu goes back to the drawer.

import { ActionHandler, AxisHandler, Image, View } from "@pocketjs/framework/solid/components";
import { BTN } from "@pocketjs/framework/input";
import type { i32 } from "@pocketjs/framework/solid/std";
import Group from "./Group.tsx";
import GroupRow from "./GroupRow.tsx";
import Separator from "./Separator.tsx";
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
        <View class="absolute top-0 left-0 w-[296] flex-col gap-[10]" style={{ translateY: -props.scroll }}>
        <Group>
          <GroupRow index={0} selected={props.selected} label="Brightness" value="" icon chevron={true} check={false}>
            <View class="w-[28] h-[28] rounded-[7px] bg-[#007aff] items-center justify-center">
              <Image src="icons/tile_brightness.svg" class="w-[16] h-[16]" />
            </View>
          </GroupRow>
          <Separator left={52} right={14} />
          <GroupRow index={1} selected={props.selected} label="Auto Dim" value={props.backlight} icon chevron={true} check={false}>
            <View class="w-[28] h-[28] rounded-[7px] bg-[#007aff] items-center justify-center">
              <Image src="icons/tile_backlight.svg" class="w-[16] h-[16]" />
            </View>
          </GroupRow>
        </Group>
        <Group>
          <GroupRow index={2} selected={props.selected} label="Clicker" value={props.clicker} icon chevron={true} check={false}>
            <View class="w-[28] h-[28] rounded-[7px] bg-[#ff2d55] items-center justify-center">
              <Image src="icons/speaker_2_fill.svg" class="w-[16] h-[16]" />
            </View>
          </GroupRow>
        </Group>
        <Group>
          <GroupRow index={3} selected={props.selected} label="Update Library" value={props.updating ? "Updating…" : ""} icon chevron={false} check={false}>
            <View class="w-[28] h-[28] rounded-[7px] bg-[#34c759] items-center justify-center">
              <Image src="icons/tile_update.svg" class="w-[16] h-[16]" />
            </View>
          </GroupRow>
        </Group>
        <Group>
          <GroupRow index={4} selected={props.selected} label="About" value="" icon chevron={true} check={false}>
            <View class="w-[28] h-[28] rounded-[7px] bg-[#8e8e93] items-center justify-center">
              <Image src="icons/tile_ipod.svg" class="w-[16] h-[16]" />
            </View>
          </GroupRow>
        </Group>
        </View>
      </View>
    </View>
  );
}
