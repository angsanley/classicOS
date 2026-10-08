// One paged library row, placed at its list position (`pitch`: the row and
// the hairline above it). Song lists with artists use two-line TrackRows.
// The first row's hairline sits above the card in the background colour, so
// every row draws the same ops. Rows past the end of the list are not drawn.

import { Show } from "solid-js";
import { View } from "@pocketjs/framework/solid/components";
import type { i32 } from "@pocketjs/framework/solid/std";
import GroupRow from "./GroupRow.tsx";
import TrackRow from "./TrackRow.tsx";

export default function LibraryRow(props: {
  index: i32;
  count: i32;
  selected: i32;
  label: string;
  /** The artist line of a two-line row */
  sub: string;
  tracks: boolean;
  twoLine: boolean;
  pitch: i32;
}) {
  return (
    <Show when={props.index < props.count}>
      <View class="absolute top-0 left-0 w-[296] flex-col" style={{ translateY: props.index * props.pitch - 1 }}>
        <View class={props.index === 0 ? "ml-[16] w-[266] h-[1] bg-[#f2f2f7]" : "ml-[16] w-[266] h-[1] bg-[#e5e5ea]"} />
        <Show when={props.twoLine}>
          <TrackRow index={props.index} selected={props.selected} title={props.label} artist={props.sub} />
        </Show>
        <Show when={!props.twoLine}>
          <GroupRow index={props.index} selected={props.selected} label={props.label} value="" icon={false} chevron={!props.tracks} check={false} />
        </Show>
      </View>
    </Show>
  );
}
