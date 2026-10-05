// App drawer (CarPlay-style 2x4 grid). The root when nothing plays; over Now
// Playing when music plays, where Menu goes back to it. The wheel moves focus
// left to right, then down; Select opens.

import { ActionHandler, AxisHandler, Image, View } from "@pocketjs/framework/solid/components";
import { BTN } from "@pocketjs/framework/input";
import type { i32 } from "@pocketjs/framework/solid/std";
import DrawerCell from "./DrawerCell.tsx";
import StatusBar from "./StatusBar.tsx";

export default function Drawer(props: {
  selected: i32;
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
      <StatusBar title="iPod" dark status={props.status} time={props.time} clock batteryPx={props.batteryPx} plugged={props.plugged} />
      {/* Grid: 4 x 78 px cells edge to edge (only the focused one has a
          background), centred; second row reserved. */}
      {/* Icons are 52 px drawn 1:1 inside a 64 px transparent texture (the
          renderer scales nearest-neighbour, so scaled icons go jagged). */}
      <View class="absolute top-[43] left-[4] flex-row">
        <DrawerCell index={0} selected={props.selected} label="Now Playing">
          <Image src="icons/app_now_playing.png" class="w-[64] h-[64]" />
        </DrawerCell>
        <DrawerCell index={1} selected={props.selected} label="Music">
          <Image src="icons/app_music.png" class="w-[64] h-[64]" />
        </DrawerCell>
        <DrawerCell index={2} selected={props.selected} label="Settings">
          <Image src="icons/app_settings.png" class="w-[64] h-[64]" />
        </DrawerCell>
      </View>
    </View>
  );
}
