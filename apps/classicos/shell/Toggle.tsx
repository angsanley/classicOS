// iOS-style switch: green track with the knob right when on.

import { View } from "@pocketjs/framework/solid/components";

export default function Toggle(props: { on: boolean }) {
  return (
    <View class={props.on ? "w-[40] h-[24] rounded-full bg-[#34c759]" : "w-[40] h-[24] rounded-full bg-[#c7c7cc]"}>
      <View class="absolute top-[2] left-[2] w-[20] h-[20] rounded-full bg-white" style={{ translateX: props.on ? 16 : 0 }} />
    </View>
  );
}
