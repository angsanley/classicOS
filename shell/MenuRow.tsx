// One list cell: icon (children), label, optional subtitle (marquees while
// the row is selected and too wide) and optional right-aligned value. Cells
// are always drawn so lists read as an even grid; the selected one is gray.
// Secondary text keeps 4.5:1 on both the cell and the focus.

import { Show, type JSX } from "solid-js";
import { Text, View } from "@pocketjs/framework/solid/components";
import type { i32 } from "@pocketjs/framework/solid/std";

export default function MenuRow(props: {
  index: i32;
  selected: i32;
  label: string;
  subtitle: string;
  subtitleFits: boolean;
  subtitleOffset: i32;
  value: string;
  /** Control after the value, e.g. a Toggle */
  trailing?: JSX.Element;
  children?: JSX.Element;
}) {
  return (
    <View
      class={props.index === props.selected
        ? "w-[296] h-[44] rounded-[14px] bg-[#d1d1d6] flex-row items-center px-[12] gap-[12]"
        : "w-[296] h-[44] rounded-[14px] bg-white flex-row items-center px-[12] gap-[12]"}
    >
      {props.children}
      <View class="flex-1 flex-col">
        <Text class="text-base text-black">{props.label}</Text>
        <Show when={props.subtitle !== ""}>
          <View class="w-[220] h-[14] flex-row overflow-hidden">
            <Show when={props.index !== props.selected}>
              <Text class="text-xs text-[#6c6c70]">{props.subtitle}</Text>
            </Show>
            <Show when={props.index === props.selected && props.subtitleFits}>
              <Text class="text-xs text-[#545458]">{props.subtitle}</Text>
            </Show>
            <Show when={props.index === props.selected && !props.subtitleFits}>
              <View class="shrink-0 flex-row" style={{ translateX: -props.subtitleOffset }}>
                <Text class="text-xs text-[#545458]">{props.subtitle}</Text>
                <View class="w-[40]" />
                <Text class="text-xs text-[#545458]">{props.subtitle}</Text>
              </View>
            </Show>
          </View>
        </Show>
      </View>
      <Show when={props.value !== ""}>
        <Text class={props.index === props.selected ? "text-sm text-[#545458]" : "text-sm text-[#6c6c70]"}>{props.value}</Text>
      </Show>
      {props.trailing}
    </View>
  );
}
