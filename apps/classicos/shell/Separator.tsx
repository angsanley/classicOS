// Hairline between GroupRows, inset on both sides like iOS: from the label
// (`left`) to where the row's content ends (`right`).

import { View } from "@pocketjs/framework/solid/components";
import type { i32 } from "@pocketjs/framework/solid/std";

export default function Separator(props: { left: i32; right: i32 }) {
  return <View class="h-[1] bg-[#e5e5ea]" style={{ marginL: props.left, width: 296 - props.left - props.right }} />;
}
