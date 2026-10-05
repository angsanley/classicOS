// Home ("iPod"): Now Playing, Music and Settings. The wheel moves the
// selection, Select opens; Menu on Now Playing comes here.

import { Show } from "solid-js";
import { ActionHandler, AxisHandler, Image, View } from "@pocketjs/framework/solid/components";
import { BTN } from "@pocketjs/framework/input";
import type { i32 } from "@pocketjs/framework/solid/std";
import MenuRow from "./MenuRow.tsx";
import StatusBar from "./StatusBar.tsx";

export default function Home(props: {
  selected: i32;
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
    <View class="w-full h-full bg-[#f2f2f7]">
      <AxisHandler axis="primary" onDelta={(delta) => props.onWheel(delta)} />
      <ActionHandler button={BTN.CIRCLE} latched onPress={() => props.onSelect()} />
      <StatusBar title="iPod" dark status={props.status} time={props.time} clock batteryPx={props.batteryPx} />
      <View class="absolute top-[30] left-[12] w-[296] h-[210] overflow-hidden">
        <View class="absolute top-0 left-0 w-[296] flex-col gap-[4]">
          <MenuRow selected={props.selected} index={0} label="Now Playing" subtitle={props.nowPlaying} subtitleFits={props.lineFits} subtitleOffset={props.lineOffset} value="">
            <Show when={props.hasArt}>
              {/* The host binds the current art to the Image in a View named
                  AlbumArt, as on Now Playing; one screen is mounted at a time. */}
              <View debugName="AlbumArt" class="w-[28] h-[28]">
                <Image src="art.png" class="w-[28] h-[28]" />
              </View>
            </Show>
            <Show when={!props.hasArt}>
              <Image src="icons/menu_now_playing.svg" class="w-[28] h-[28]" />
            </Show>
          </MenuRow>
          <MenuRow selected={props.selected} index={1} label="Music" subtitle="" subtitleFits subtitleOffset={0} value="">
            <View class="w-[28] h-[28] rounded-full bg-[#fa2d48] items-center justify-center">
            <Image src="icons/music_note_2.svg" class="w-[16] h-[16]" />
          </View>
          </MenuRow>
          <MenuRow selected={props.selected} index={2} label="Settings" subtitle="" subtitleFits subtitleOffset={0} value="">
            <View class="w-[28] h-[28] rounded-full bg-[#8e8e93] items-center justify-center">
            <Image src="icons/tile_settings.svg" class="w-[16] h-[16]" />
          </View>
          </MenuRow>
        </View>
      </View>
    </View>
  );
}
