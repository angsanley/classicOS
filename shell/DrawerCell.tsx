// One app in the drawer grid: a big icon (children, a 64 px texture with 6 px
// of transparent margin, which also spaces the label) over its label. The
// focused app gets a soft gray rounded cell behind both. Unfocused cells
// paint the drawer's own colour instead of nothing, so every cell draws the
// same ops: the damage diff compares draw lists op by op and repaints the
// whole screen when one appears or disappears.

import type { JSX } from "solid-js";
import { Text, View } from "@pocketjs/framework/solid/components";
import type { i32 } from "@pocketjs/framework/solid/std";

export default function DrawerCell(props: { index: i32; selected: i32; label: string; children?: JSX.Element }) {
  return (
    <View
      class={props.index === props.selected
        ? "w-[78] h-[89] rounded-[16px] bg-[#00000014] flex-col items-center justify-center"
        : "w-[78] h-[89] rounded-[16px] bg-[#f2f2f7] flex-col items-center justify-center"}
    >
      {props.children}
      <Text class="text-xs text-[#1a1a1a]">{props.label}</Text>
    </View>
  );
}
