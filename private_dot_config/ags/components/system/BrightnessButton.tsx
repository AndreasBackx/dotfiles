import { Gtk } from "ags/gtk4"

import { attachPopoverHandlers } from "../../lib/widget-helpers"
import { command, createTextPoll, run } from "../../lib/runtime"

export default function BrightnessButton() {
  const text = createTextPoll(3000, command("eww-brightness", "text"))
  const tooltip = createTextPoll(3000, command("eww-brightness", "tooltip"))

  return (
    <menubutton class="bar-menu-button" tooltipText={tooltip}>
      <box class="bar-item with-text">
        <label class="item-icon" label="󰃠" />
        <label class="item-text" label={text} />
      </box>
      <popover $={(self: Gtk.Popover) => attachPopoverHandlers(self)}>
        <box class="panel" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
          <label class="panel-title" label="Brightness" xalign={0} />
          <box class="panel-row" spacing={8}>
            <button onClicked={() => run(command("eww-brightness", "down"))}>-10%</button>
            <button onClicked={() => run(command("eww-brightness", "up"))}>+10%</button>
          </box>
          <box class="panel-row" spacing={8}>
            {[0, 25, 50, 75, 100].map((value) => (
              <button onClicked={() => run(command("eww-brightness", "set", `${value}`))}>
                <label label={`${value}`} />
              </button>
            ))}
          </box>
        </box>
      </popover>
    </menubutton>
  )
}
