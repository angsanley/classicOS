// Hold: the hold switch is on, from any screen. Black, nothing to press (the
// switch blocks the buttons), nothing animates. Playing: centred art, the
// title and artist below it, no seekbar. Nothing playing: the date and a big time.
// Hold off returns to the screen underneath.

import { Show } from "solid-js";
import { Image, Text, View } from "@pocketjs/framework/solid/components";
import type { i32 } from "@pocketjs/framework/solid/std";
import StatusBar from "./StatusBar.tsx";

export default function Hold(props: {
  hasTrack: boolean;
  hasArt: boolean;
  title: string;
  /** "Artist — Album" */
  subtitle: string;
  date: string;
  status: string;
  time: string;
  batteryPx: i32;
  plugged: boolean;
}) {
  return (
    <View class="w-full h-full bg-black">
      <Show when={props.hasTrack}>
        <StatusBar title={props.date} lock dark={false} status={props.status} time={props.time} clock batteryPx={props.batteryPx} plugged={props.plugged} />
        <View class="absolute top-[34] left-[96] w-[128] h-[128] rounded-[14px] bg-[#3a3a3c] items-center justify-center">
          <Image src="icons/music_note_2.svg" class="w-[64] h-[64]" />
        </View>
        <Show when={props.hasArt}>
          {/* The host binds the current art to the Image in a View named
              AlbumArt; the 128 px texture is drawn 1:1. */}
          <View debugName="AlbumArt" class="absolute top-[34] left-[96] w-[128] h-[128]">
            <Image src="art.png" class="w-[128] h-[128]" />
          </View>
        </Show>
        {/* Left-aligned: a long title keeps its start and clips at the end. */}
        <View class="absolute top-[172] left-[16] right-[16] flex-col">
          <View class="w-[288] h-[24] flex-row overflow-hidden">
            <Text class="text-lg text-white font-bold">{props.title}</Text>
          </View>
          <View class="w-[288] h-[18] flex-row overflow-hidden">
            <Text class="text-sm text-[#ffffffa6]">{props.subtitle}</Text>
          </View>
        </View>
      </Show>
      <Show when={!props.hasTrack}>
        <StatusBar title="" lock dark={false} status={props.status} time={props.time} clock={false} batteryPx={props.batteryPx} plugged={props.plugged} />
        <View class="absolute inset-0 flex-col items-center justify-center">
          <Text class="text-sm text-[#ffffffa6] font-bold">{props.date}</Text>
          <Text class="text-5xl text-white font-bold">{props.time}</Text>
        </View>
      </Show>
    </View>
  );
}
