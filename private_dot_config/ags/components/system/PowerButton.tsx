import { Gtk } from "ags/gtk4"

import { attachPopoverHandlers } from "../../lib/widget-helpers"
import { BIN, run } from "../../lib/runtime"

type PowerButtonProps = {
  instanceId: string
}

export default function PowerButton({ instanceId }: PowerButtonProps) {
  const popoverId = `power-popover-${instanceId}`

  return (
    <menubutton class="bar-menu-button" tooltipText="Power options">
      <box class="bar-item icon-only">
        <label class="item-icon item-icon-only" label="⏻" />
      </box>
      <popover $={(self: Gtk.Popover) => attachPopoverHandlers(self, popoverId)}>
        <box class="panel" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
          <label class="panel-title" label="Power" xalign={0} />
          <label class="panel-section-title" label="Session" xalign={0} />
          <box class="panel-row" spacing={8}>
            <button onClicked={() => run([`${BIN}/power-options`, "logout"])}>logout</button>
            <button onClicked={() => run([`${BIN}/power-options`, "suspend"])}>suspend</button>
            <button onClicked={() => run([`${BIN}/power-options`, "hibernate"])}>hibernate</button>
          </box>
          <label class="panel-section-title" label="System" xalign={0} />
          <box class="panel-row" spacing={8}>
            <button onClicked={() => run([`${BIN}/power-options`, "reboot"])}>reboot</button>
            <button class="danger" onClicked={() => run([`${BIN}/power-options`, "shutdown"])}>shutdown</button>
          </box>
          <label class="panel-section-title" label="After updates" xalign={0} />
          <box class="panel-row" spacing={8}>
            <button onClicked={() => run([`${BIN}/power-options`, "update-reboot"])}>update + reboot</button>
            <button onClicked={() => run([`${BIN}/power-options`, "update-shutdown"])}>update + shutdown</button>
          </box>
        </box>
      </popover>
    </menubutton>
  )
}
