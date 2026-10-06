// Music: the library menu, one Group with Apple Music's red glyphs (no tiles,
// as in Apple Music). Select opens a list; Menu goes back to the drawer.

import { ActionHandler, AxisHandler, Image, View } from "@pocketjs/framework/solid/components";
import { BTN } from "@pocketjs/framework/input";
import type { i32 } from "@pocketjs/framework/solid/std";
import Group from "./Group.tsx";
import GroupRow from "./GroupRow.tsx";
import Separator from "./Separator.tsx";
import StatusBar from "./StatusBar.tsx";

export default function Music(props: {
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
      <StatusBar title="Music" lock={false} dark status={props.status} time={props.time} clock batteryPx={props.batteryPx} plugged={props.plugged} />
      <View class="absolute top-[30] left-[12]">
        <Group>
          <GroupRow index={0} selected={props.selected} label="Playlists" value="" icon chevron check={false}>
            <Image src="icons/menu_playlists.svg" class="w-[32] h-[32]" />
          </GroupRow>
          <Separator left={56} right={14} />
          <GroupRow index={1} selected={props.selected} label="Artists" value="" icon chevron check={false}>
            <Image src="icons/menu_artists.svg" class="w-[32] h-[32]" />
          </GroupRow>
          <Separator left={56} right={14} />
          <GroupRow index={2} selected={props.selected} label="Albums" value="" icon chevron check={false}>
            <Image src="icons/menu_albums.svg" class="w-[32] h-[32]" />
          </GroupRow>
          <Separator left={56} right={14} />
          <GroupRow index={3} selected={props.selected} label="Songs" value="" icon chevron check={false}>
            <Image src="icons/menu_songs.svg" class="w-[32] h-[32]" />
          </GroupRow>
        </Group>
      </View>
    </View>
  );
}
