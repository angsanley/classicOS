// One level of the library behind Music (Artists, an artist's albums, an
// album's songs...). The list holds only the rows around the scroll position
// (rows from `first`); the wheel moves the selection, Select opens a row or
// plays a song, Menu goes up a level and from the first back to Music.

import { Show } from "solid-js";
import { ActionHandler, AxisHandler, Text, View } from "@pocketjs/framework/solid/components";
import { BTN } from "@pocketjs/framework/input";
import type { i32 } from "@pocketjs/framework/solid/std";
import LibraryRow from "./LibraryRow.tsx";
import Spinner from "./Spinner.tsx";
import StatusBar from "./StatusBar.tsx";

export default function Library(props: {
  title: string;
  ready: boolean;
  loading: boolean;
  /** Spinner frame, 0-7 */
  spinner: i32;
  count: i32;
  first: i32;
  rows: string[];
  /** Rows are songs: no chevrons */
  tracks: boolean;
  /** Song rows' artist lines (twoLine) */
  subs: string[];
  twoLine: boolean;
  /** Row pitch, px */
  pitch: i32;
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
      <StatusBar title={props.title} lock={false} dark status={props.status} time={props.time} clock batteryPx={props.batteryPx} plugged={props.plugged} />
      <Show when={props.loading || !props.ready}>
        <View class="absolute top-[30] left-0 right-0 bottom-0 items-center justify-center">
          <Spinner frame={props.spinner} />
        </View>
      </Show>
      <Show when={props.count === 0 && props.ready && !props.loading}>
        <View class="absolute top-[30] left-0 right-0 bottom-0 items-center justify-center">
          <Text class="text-base text-[#6c6c70]">No Music</Text>
        </View>
      </Show>
      <View class="absolute top-[30] left-[12] w-[296] h-[210] overflow-hidden">
        <View class="absolute top-0 left-0 w-[296]" style={{ translateY: -props.scroll }}>
          <View class="absolute top-0 left-0 w-[296] rounded-[14px] bg-white" style={{ height: props.count * props.pitch - 1 }} />
          <LibraryRow index={props.first} count={props.count} selected={props.selected} label={props.rows[0] ?? ""} sub={props.subs[0] ?? ""} tracks={props.tracks} twoLine={props.twoLine} pitch={props.pitch} />
          <LibraryRow index={props.first + 1} count={props.count} selected={props.selected} label={props.rows[1] ?? ""} sub={props.subs[1] ?? ""} tracks={props.tracks} twoLine={props.twoLine} pitch={props.pitch} />
          <LibraryRow index={props.first + 2} count={props.count} selected={props.selected} label={props.rows[2] ?? ""} sub={props.subs[2] ?? ""} tracks={props.tracks} twoLine={props.twoLine} pitch={props.pitch} />
          <LibraryRow index={props.first + 3} count={props.count} selected={props.selected} label={props.rows[3] ?? ""} sub={props.subs[3] ?? ""} tracks={props.tracks} twoLine={props.twoLine} pitch={props.pitch} />
          <LibraryRow index={props.first + 4} count={props.count} selected={props.selected} label={props.rows[4] ?? ""} sub={props.subs[4] ?? ""} tracks={props.tracks} twoLine={props.twoLine} pitch={props.pitch} />
          <LibraryRow index={props.first + 5} count={props.count} selected={props.selected} label={props.rows[5] ?? ""} sub={props.subs[5] ?? ""} tracks={props.tracks} twoLine={props.twoLine} pitch={props.pitch} />
        </View>
      </View>
    </View>
  );
}
