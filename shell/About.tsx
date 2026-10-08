// Settings > About, iOS style: read-only Groups (Device, Storage, Power).
// Nothing is focused; the wheel scrolls, Select or Menu goes back.

import { ActionHandler, AxisHandler, View } from "@pocketjs/framework/solid/components";
import { BTN } from "@pocketjs/framework/input";
import type { i32 } from "@pocketjs/framework/solid/std";
import Group from "./Group.tsx";
import GroupRow from "./GroupRow.tsx";
import Separator from "./Separator.tsx";
import StatusBar from "./StatusBar.tsx";

export default function About(props: {
  version: string;
  songs: string;
  capacity: string;
  available: string;
  battery: string;
  /** List scroll in px */
  scroll: i32;
  status: string;
  time: string;
  batteryPx: i32;
  plugged: boolean;
  onWheel: (delta: i32) => void;
  onBack: () => void;
}) {
  return (
    <View class="w-full h-full bg-[#f2f2f7]">
      <AxisHandler axis="primary" onDelta={(delta) => props.onWheel(delta)} />
      <ActionHandler button={BTN.CIRCLE} latched onPress={() => props.onBack()} />
      <ActionHandler button={BTN.CROSS} latched onPress={() => props.onBack()} />
      <StatusBar title="About" lock={false} dark status={props.status} time={props.time} clock batteryPx={props.batteryPx} plugged={props.plugged} />
      <View class="absolute top-[30] left-[12] w-[296] h-[210] overflow-hidden">
        <View class="absolute top-0 left-0 w-[296] flex-col gap-[10]" style={{ translateY: -props.scroll }}>
          <Group>
            <GroupRow index={0} selected={-1} label="Model" value="iPod Video" icon={false} chevron={false} check={false} />
            <Separator left={16} right={14} />
            <GroupRow index={1} selected={-1} label="Version" value={props.version} icon={false} chevron={false} check={false} />
          </Group>
          <Group>
            <GroupRow index={2} selected={-1} label="Songs" value={props.songs} icon={false} chevron={false} check={false} />
            <Separator left={16} right={14} />
            <GroupRow index={3} selected={-1} label="Capacity" value={props.capacity} icon={false} chevron={false} check={false} />
            <Separator left={16} right={14} />
            <GroupRow index={4} selected={-1} label="Available" value={props.available} icon={false} chevron={false} check={false} />
          </Group>
          <Group>
            <GroupRow index={5} selected={-1} label="Battery" value={props.battery} icon={false} chevron={false} check={false} />
          </Group>
        </View>
      </View>
    </View>
  );
}
