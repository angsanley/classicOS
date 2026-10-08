// A four-option Settings page (Backlight, Clicker): one Group, checkmark on
// the right of the current value as in iOS. Select picks the selected row and
// goes back, Menu goes back unchanged.

import { ActionHandler, AxisHandler, View } from "@pocketjs/framework/solid/components";
import { BTN } from "@pocketjs/framework/input";
import type { i32 } from "@pocketjs/framework/solid/std";
import Group from "./Group.tsx";
import GroupRow from "./GroupRow.tsx";
import Separator from "./Separator.tsx";
import StatusBar from "./StatusBar.tsx";

export default function Picker(props: {
  title: string;
  /** Row labels, top to bottom */
  label0: string;
  label1: string;
  label2: string;
  label3: string;
  selected: i32;
  /** Row of the current value, -1 if none matches */
  current: i32;
  status: string;
  time: string;
  batteryPx: i32;
  plugged: boolean;
  onWheel: (delta: i32) => void;
  onSelect: () => void;
  onBack: () => void;
}) {
  return (
    <View class="w-full h-full bg-[#f2f2f7]">
      <AxisHandler axis="primary" onDelta={(delta) => props.onWheel(delta)} />
      <ActionHandler button={BTN.CIRCLE} latched onPress={() => props.onSelect()} />
      <ActionHandler button={BTN.CROSS} latched onPress={() => props.onBack()} />
      <StatusBar title={props.title} lock={false} dark status={props.status} time={props.time} clock batteryPx={props.batteryPx} plugged={props.plugged} />
      <View class="absolute top-[30] left-[12]">
        <Group>
          <GroupRow index={0} selected={props.selected} label={props.label0} value="" icon={false} chevron={false} check={props.current === 0} />
          <Separator left={16} right={14} />
          <GroupRow index={1} selected={props.selected} label={props.label1} value="" icon={false} chevron={false} check={props.current === 1} />
          <Separator left={16} right={14} />
          <GroupRow index={2} selected={props.selected} label={props.label2} value="" icon={false} chevron={false} check={props.current === 2} />
          <Separator left={16} right={14} />
          <GroupRow index={3} selected={props.selected} label={props.label3} value="" icon={false} chevron={false} check={props.current === 3} />
        </Group>
      </View>
    </View>
  );
}
