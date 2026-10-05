// Music: the library menu. The wheel moves the selection and the list scrolls
// to keep it in view; Select opens, Menu goes back to the drawer.

import { ActionHandler, AxisHandler, Image, View } from "@pocketjs/framework/solid/components";
import { BTN } from "@pocketjs/framework/input";
import type { i32 } from "@pocketjs/framework/solid/std";
import MenuRow from "./MenuRow.tsx";
import StatusBar from "./StatusBar.tsx";

export default function Music(props: {
  selected: i32;
  scroll: i32;
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
      <StatusBar title="Music" dark status={props.status} time={props.time} clock batteryPx={props.batteryPx} plugged={props.plugged} />
      <View class="absolute top-[30] left-[12] w-[296] h-[210] overflow-hidden">
        <View class="absolute top-0 left-0 w-[296] flex-col gap-[4]" style={{ translateY: -props.scroll }}>
          <MenuRow selected={props.selected} index={0} label="Playlists" subtitle="" subtitleFits subtitleOffset={0} value="">
            <Image src="icons/menu_playlists.svg" class="w-[32] h-[32]" />
          </MenuRow>
          <MenuRow selected={props.selected} index={1} label="Artists" subtitle="" subtitleFits subtitleOffset={0} value="">
            <Image src="icons/menu_artists.svg" class="w-[32] h-[32]" />
          </MenuRow>
          <MenuRow selected={props.selected} index={2} label="Albums" subtitle="" subtitleFits subtitleOffset={0} value="">
            <Image src="icons/menu_albums.svg" class="w-[32] h-[32]" />
          </MenuRow>
          <MenuRow selected={props.selected} index={3} label="Songs" subtitle="" subtitleFits subtitleOffset={0} value="">
            <Image src="icons/menu_songs.svg" class="w-[32] h-[32]" />
          </MenuRow>
        </View>
      </View>
    </View>
  );
}
