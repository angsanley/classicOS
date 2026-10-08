// A song row with two lines, title over artist, in the GroupRow style
// (inset focus cell, a colour swap). 52 px tall. Untagged files have no
// artist: "Unknown Artist", as Apple shows.

import { Text, View } from "@pocketjs/framework/solid/components";
import type { i32 } from "@pocketjs/framework/solid/std";

export default function TrackRow(props: { index: i32; selected: i32; title: string; artist: string }) {
  return (
    <View class="w-[296] h-[52] p-[4]">
      <View
        class={props.index === props.selected
          ? "w-[288] h-[44] rounded-[10px] bg-[#d1d1d6] flex-col justify-center pl-[12] pr-[10] overflow-hidden"
          : "w-[288] h-[44] rounded-[10px] bg-white flex-col justify-center pl-[12] pr-[10] overflow-hidden"}
      >
        <Text class="text-base text-black">{props.title}</Text>
        <Text class={props.index === props.selected ? "text-xs text-[#545458]" : "text-xs text-[#6c6c70]"}>{props.artist !== "" ? props.artist : "Unknown Artist"}</Text>
      </View>
    </View>
  );
}
