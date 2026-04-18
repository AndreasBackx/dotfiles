import { Gtk } from "ags/gtk4"

import { getBatteryState } from "./BatteryState"
import SystemMenuButton from "../system/SystemMenuButton"

type BatteryButtonProps = {
  instanceId: string
}

/**
 * Shows the current battery icon and percentage when a battery is present.
 */
export default function BatteryButton({ instanceId }: BatteryButtonProps) {
  const { details, iconName, visible, text, tooltip, state } = getBatteryState()
  const popoverId = `battery-popover-${instanceId}`

  return (
    <box visible={visible}>
      <SystemMenuButton
        popoverId={popoverId}
        instanceId={instanceId}
        tooltipText={tooltip}
        button={
          <box class={state((value) => `bar-item with-text battery battery-${value}`)} halign={Gtk.Align.CENTER}>
            <box class="system-button-content with-text" halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER}>
              <image iconName={iconName} pixelSize={16} />
              <label class="item-text" label={text} />
            </box>
          </box>
        }
      >
        <box class="panel" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
          <label class="panel-title" label="Battery" xalign={0} />
          <centerbox orientation={Gtk.Orientation.HORIZONTAL}>
            <label $type="start" label="Status" xalign={0} />
            <label $type="end" class="panel-status" label={details((value) => value.status)} xalign={1} />
          </centerbox>
          <centerbox orientation={Gtk.Orientation.HORIZONTAL}>
            <label $type="start" label="Health" xalign={0} />
            <label $type="end" class="panel-status" label={details((value) => value.health)} xalign={1} />
          </centerbox>
          <centerbox orientation={Gtk.Orientation.HORIZONTAL}>
            <label $type="start" label="Cycles" xalign={0} />
            <label $type="end" class="panel-status" label={details((value) => value.cycles)} xalign={1} />
          </centerbox>
        </box>
      </SystemMenuButton>
    </box>
  )
}
