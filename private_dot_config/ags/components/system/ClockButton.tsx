import GLib from "gi://GLib?version=2.0"

import { Gtk } from "ags/gtk4"
import { createPoll } from "ags/time"

import { attachPopoverHandlers } from "../../lib/widget-helpers"

export default function ClockButton() {
  const time = createPoll("", 1000, () => GLib.DateTime.new_now_local().format("%a %d %b %H:%M") ?? "")
  const tooltip = createPoll("", 1000, () =>
    GLib.DateTime.new_now_local().format("%a %d %b %Y %H:%M:%S %Z") ?? "",
  )

  return (
    <menubutton class="bar-menu-button" tooltipText={tooltip}>
      <box class="bar-item clock-item">
        <label label={time} />
      </box>
      <popover $={(self: Gtk.Popover) => attachPopoverHandlers(self)}>
        <box class="panel" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
          <Gtk.Calendar />
        </box>
      </popover>
    </menubutton>
  )
}
