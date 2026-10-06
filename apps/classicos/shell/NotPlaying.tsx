// Now Playing with nothing to play (nothing has played yet): the placeholder
// art and "Not Playing" where the title goes, as iOS shows. Menu goes back.

import { ActionHandler, Image, Text, View } from "@pocketjs/framework/solid/components";
import { BTN } from "@pocketjs/framework/input";
import type { i32 } from "@pocketjs/framework/solid/std";
import StatusBar from "./StatusBar.tsx";

export default function NotPlaying(props: {
  status: string;
  time: string;
  batteryPx: i32;
  plugged: boolean;
  onBack: () => void;
}) {
  return (
    <View class="w-full h-full bg-gradient-to-b from-[#5b6270] to-[#16181c] overflow-hidden">
      <ActionHandler button={BTN.CROSS} latched onPress={() => props.onBack()} />
      <View class="absolute inset-0 bg-[#00000040]" />
      <StatusBar title="Now Playing" lock={false} dark={false} status={props.status} time={props.time} clock batteryPx={props.batteryPx} plugged={props.plugged} />
      <View class="absolute top-[34] left-[16] w-[128] h-[128] rounded-[14px] bg-[#8a8d93] shadow-lg items-center justify-center">
        <Image src="icons/music_note_2.svg" class="w-[64] h-[64]" />
      </View>
      <View class="absolute top-[34] left-[158] w-[146] h-[128] flex-col justify-center">
        <Text class="text-xl text-white font-bold">Not Playing</Text>
      </View>
    </View>
  );
}
