// A grouped-list section (iOS / CarPlay Settings): a white rounded card
// holding GroupRows, with Separators between them.

import type { JSX } from "solid-js";
import { View } from "@pocketjs/framework/solid/components";

export default function Group(props: { children?: JSX.Element }) {
  return <View class="w-[296] rounded-[14px] bg-white flex-col">{props.children}</View>;
}
