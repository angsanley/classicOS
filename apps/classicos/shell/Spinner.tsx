// iOS activity indicator, after Flutter's CupertinoActivityIndicator
// (cupertino/activity_indicator.dart): 8 ticks at radius 10, each r/5 wide
// from r/3 to r, #3C3C44 at alphas 47,47,47,47,72,97,122,147 of 255; the
// bright tick steps clockwise every 125 ms. Each step is a pre-baked frame
// (icons/spinner_N.svg, anti-aliased, drawn 1:1) since rotated quads
// render jagged.

import { Show } from "solid-js";
import { Image, View } from "@pocketjs/framework/solid/components";
import type { i32 } from "@pocketjs/framework/solid/std";

export default function Spinner(props: { frame: i32 }) {
  return (
    <View class="w-[32] h-[32]">
      <Show when={props.frame === 0}>
        <Image src="icons/spinner_0.svg" class="w-[32] h-[32]" />
      </Show>
      <Show when={props.frame === 1}>
        <Image src="icons/spinner_1.svg" class="w-[32] h-[32]" />
      </Show>
      <Show when={props.frame === 2}>
        <Image src="icons/spinner_2.svg" class="w-[32] h-[32]" />
      </Show>
      <Show when={props.frame === 3}>
        <Image src="icons/spinner_3.svg" class="w-[32] h-[32]" />
      </Show>
      <Show when={props.frame === 4}>
        <Image src="icons/spinner_4.svg" class="w-[32] h-[32]" />
      </Show>
      <Show when={props.frame === 5}>
        <Image src="icons/spinner_5.svg" class="w-[32] h-[32]" />
      </Show>
      <Show when={props.frame === 6}>
        <Image src="icons/spinner_6.svg" class="w-[32] h-[32]" />
      </Show>
      <Show when={props.frame === 7}>
        <Image src="icons/spinner_7.svg" class="w-[32] h-[32]" />
      </Show>
    </View>
  );
}
