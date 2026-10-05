// One Music menu row: an icon (children), its label and an optional subtitle
// that marquees while the row is selected and too wide.

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
  children?: JSX.Element;
}) {
  return (
    <View
      class={props.index === props.selected
        ? "w-[296] h-[44] rounded-[14px] bg-[#d1d1d6] flex-row items-center px-[12] gap-[12]"
        : "w-[296] h-[44] rounded-[14px] bg-white flex-row items-center px-[12] gap-[12]"}
    >
      {props.children}
      <View class="flex-col">
        <Text class="text-base text-black font-bold">{props.label}</Text>
        <Show when={props.subtitle !== ""}>
          <View class="w-[220] h-[14] flex-row overflow-hidden">
            <Show when={props.index !== props.selected || props.subtitleFits}>
              <Text class="text-xs text-[#3c3c4399]">{props.subtitle}</Text>
            </Show>
            <Show when={props.index === props.selected && !props.subtitleFits}>
              <View class="shrink-0 flex-row" style={{ translateX: -props.subtitleOffset }}>
                <Text class="text-xs text-[#3c3c4399]">{props.subtitle}</Text>
                <View class="w-[40]" />
                <Text class="text-xs text-[#3c3c4399]">{props.subtitle}</Text>
              </View>
            </Show>
          </View>
        </Show>
      </View>
    </View>
  );
}
