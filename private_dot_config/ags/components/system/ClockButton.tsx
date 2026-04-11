import GLib from "gi://GLib?version=2.0"

import { Gtk } from "ags/gtk4"
import { createPoll } from "ags/time"

import SystemMenuButton from "./SystemMenuButton"

type ClockButtonProps = {
  instanceId: string
}

/**
 * Shows the current local time and a calendar popover.
 */
export default function ClockButton({ instanceId }: ClockButtonProps) {
  const time = createPoll("", 1000, () => GLib.DateTime.new_now_local().format("%a %d %b %H:%M") ?? "")
  const tooltip = createPoll("", 1000, () =>
    GLib.DateTime.new_now_local().format("%a %d %b %Y %H:%M:%S %Z") ?? "",
  )
  const popoverId = `clock-popover-${instanceId}`

  return (
    <SystemMenuButton
      popoverId={popoverId}
      tooltipText={tooltip}
      button={
        <box class="bar-item clock-item">
          <label label={time} />
        </box>
      }
    >
        <box class="panel" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
          <Gtk.Calendar />
        </box>
    </SystemMenuButton>
  )
}
