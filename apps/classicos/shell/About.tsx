// Settings > About: firmware version, disk capacity and free space, battery.
// Nothing to select; Select or Menu goes back.

import { ActionHandler, View } from "@pocketjs/framework/solid/components";
import { BTN } from "@pocketjs/framework/input";
import type { i32 } from "@pocketjs/framework/solid/std";
import MenuRow from "./MenuRow.tsx";
import StatusBar from "./StatusBar.tsx";

export default function About(props: {
  version: string;
  capacity: string;
  available: string;
  battery: string;
  status: string;
  time: string;
  batteryPx: i32;
  plugged: boolean;
  onBack: () => void;
}) {
  return (
    <View class="w-full h-full bg-[#f2f2f7]">
      <ActionHandler button={BTN.CIRCLE} latched onPress={() => props.onBack()} />
      <ActionHandler button={BTN.CROSS} latched onPress={() => props.onBack()} />
      <StatusBar title="About" dark status={props.status} time={props.time} clock batteryPx={props.batteryPx} plugged={props.plugged} />
      <View class="absolute top-[34] left-[12] w-[296] flex-col gap-[4]">
        <MenuRow selected={-1} index={0} label="Version" subtitle="" subtitleFits subtitleOffset={0} value={props.version} />
        <MenuRow selected={-1} index={1} label="Capacity" subtitle="" subtitleFits subtitleOffset={0} value={props.capacity} />
        <MenuRow selected={-1} index={2} label="Available" subtitle="" subtitleFits subtitleOffset={0} value={props.available} />
        <MenuRow selected={-1} index={3} label="Battery" subtitle="" subtitleFits subtitleOffset={0} value={props.battery} />
      </View>
    </View>
  );
}
