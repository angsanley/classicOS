// One paged Music row, placed at its list position (48 px pitch, as in
// app.ts ROW_PITCH); rows past the end of the list are not drawn.

import { Show } from "solid-js";
import { View } from "@pocketjs/framework/solid/components";
import type { i32 } from "@pocketjs/framework/solid/std";
import MenuRow from "./MenuRow.tsx";

export default function LibraryRow(props: { index: i32; count: i32; selected: i32; label: string }) {
  return (
    <Show when={props.index < props.count}>
      <View class="absolute top-0 left-0" style={{ translateY: props.index * 48 }}>
        <MenuRow selected={props.selected} index={props.index} label={props.label} subtitle="" subtitleFits subtitleOffset={0} value="" />
      </View>
    </Show>
  );
}
