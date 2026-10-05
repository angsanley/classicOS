// Music: the root menu, watchOS Music style. The wheel moves the selection
// and the list scrolls to keep it in view; Select opens.

import { Show } from "solid-js";
import { ActionHandler, AxisHandler, Image, View } from "@pocketjs/framework/solid/components";
import { BTN } from "@pocketjs/framework/input";
import type { i32 } from "@pocketjs/framework/solid/std";
import MenuRow from "./MenuRow.tsx";
import StatusBar from "./StatusBar.tsx";

export default function Music(props: {
  selected: i32;
  scroll: i32;
  /** "Title · Artist" of the current track, "" when stopped */
  nowPlaying: string;
  hasArt: boolean;
  lineFits: boolean;
  lineOffset: i32;
  status: string;
  time: string;
  batteryPx: i32;
  onWheel: (delta: i32) => void;
  onSelect: () => void;
}) {
  return (
    <View class="w-full h-full bg-white">
      <AxisHandler axis="primary" onDelta={(delta) => props.onWheel(delta)} />
      <ActionHandler button={BTN.CIRCLE} onPress={() => props.onSelect()} />
      <StatusBar title="iPod" dark status={props.status} time={props.time} clock batteryPx={props.batteryPx} />
      <View class="absolute top-[30] left-[12] w-[296] h-[210] overflow-hidden">
        <View class="absolute top-0 left-0 w-[296] flex-col gap-[4]" style={{ translateY: -props.scroll }}>
          <MenuRow selected={props.selected} index={0} label="Now Playing" subtitle={props.nowPlaying} subtitleFits={props.lineFits} subtitleOffset={props.lineOffset}>
            <Show when={props.hasArt}>
              {/* The host binds the current art to the Image in a View named
                  AlbumArt, as on Now Playing; one screen is mounted at a time. */}
              <View debugName="AlbumArt" class="w-[24] h-[24]">
                <Image src="art.png" class="w-[24] h-[24]" />
              </View>
            </Show>
            <Show when={!props.hasArt}>
              <Image src="icons/menu_now_playing.svg" class="w-[24] h-[24]" />
            </Show>
          </MenuRow>
          <MenuRow selected={props.selected} index={1} label="Playlists" subtitle="" subtitleFits subtitleOffset={0}>
            <Image src="icons/menu_playlists.svg" class="w-[24] h-[24]" />
          </MenuRow>
          <MenuRow selected={props.selected} index={2} label="Artists" subtitle="" subtitleFits subtitleOffset={0}>
            <Image src="icons/menu_artists.svg" class="w-[24] h-[24]" />
          </MenuRow>
          <MenuRow selected={props.selected} index={3} label="Albums" subtitle="" subtitleFits subtitleOffset={0}>
            <Image src="icons/menu_albums.svg" class="w-[24] h-[24]" />
          </MenuRow>
          <MenuRow selected={props.selected} index={4} label="Songs" subtitle="" subtitleFits subtitleOffset={0}>
            <Image src="icons/menu_songs.svg" class="w-[24] h-[24]" />
          </MenuRow>
          <MenuRow selected={props.selected} index={5} label="Shuffle" subtitle="" subtitleFits subtitleOffset={0}>
            <Image src="icons/menu_shuffle.svg" class="w-[24] h-[24]" />
          </MenuRow>
          <MenuRow selected={props.selected} index={6} label="Settings" subtitle="" subtitleFits subtitleOffset={0}>
            <Image src="icons/menu_settings.svg" class="w-[24] h-[24]" />
          </MenuRow>
        </View>
      </View>
    </View>
  );
}
