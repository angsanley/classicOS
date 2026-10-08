// One row of a Group: optional icon tile (children), label, optional value,
// chevron (opens a page) or checkmark (picker). Focus is a gray rounded cell
// inset in the row; unfocused rows paint white, so moving focus is a colour
// swap and repaints just the two rows (see AGENTS.md, repaint cost).

import { Show, type JSX } from "solid-js";
import { Image, Text, View } from "@pocketjs/framework/solid/components";
import type { i32 } from "@pocketjs/framework/solid/std";

export default function GroupRow(props: {
  index: i32;
  /** -1 for read-only lists */
  selected: i32;
  label: string;
  value: string;
  /** An icon tile in children: tighter left padding */
  icon: boolean;
  chevron: boolean;
  check: boolean;
  children?: JSX.Element;
}) {
  return (
    <View class="w-[296] h-[44] p-[4]">
      <View
        class={props.index === props.selected
          ? props.icon
            ? "w-[288] h-[36] rounded-[10px] bg-[#d1d1d6] flex-row items-center pl-[8] pr-[10] gap-[12]"
            : "w-[288] h-[36] rounded-[10px] bg-[#d1d1d6] flex-row items-center pl-[12] pr-[10] gap-[12]"
          : props.icon
            ? "w-[288] h-[36] rounded-[10px] bg-white flex-row items-center pl-[8] pr-[10] gap-[12]"
            : "w-[288] h-[36] rounded-[10px] bg-white flex-row items-center pl-[12] pr-[10] gap-[12]"}
      >
        {props.children}
        <View class="flex-1 overflow-hidden">
          <Text class="text-base text-black">{props.label}</Text>
        </View>
        <Show when={props.value !== ""}>
          <Text class={props.index === props.selected ? "text-sm text-[#545458]" : "text-sm text-[#6c6c70]"}>{props.value}</Text>
        </Show>
        <Show when={props.chevron}>
          <Image src="icons/chevron.svg" class="w-[16] h-[16]" />
        </Show>
        <Show when={props.check}>
          <Image src="icons/check.svg" class="w-[16] h-[16]" />
        </Show>
      </View>
    </View>
  );
}
