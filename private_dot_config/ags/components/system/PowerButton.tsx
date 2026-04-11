import { Gtk } from "ags/gtk4"

import { BIN, run } from "../../lib/runtime"

import SystemMenuButton from "./SystemMenuButton"

type PowerButtonProps = {
  instanceId: string
}

/**
 * Exposes session and power-management actions in a popover.
 */
export default function PowerButton({ instanceId }: PowerButtonProps) {
  const popoverId = `power-popover-${instanceId}`
  // Keep the click handlers short while still routing every action through the
  // same helper script.
  const powerOption = (action: string) => run([`${BIN}/power-options`, action])

  return (
    <SystemMenuButton
      popoverId={popoverId}
      tooltipText="Power options"
      button={
        <box class="bar-item icon-only">
          <label class="item-icon item-icon-only" label="⏻" />
        </box>
      }
    >
        <box class="panel" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
          <label class="panel-title" label="Power" xalign={0} />
          <label class="panel-section-title" label="Session" xalign={0} />
          <box class="panel-row" spacing={8}>
            <button onClicked={() => powerOption("logout")}>logout</button>
            <button onClicked={() => powerOption("suspend")}>suspend</button>
            <button onClicked={() => powerOption("hibernate")}>hibernate</button>
          </box>
          <label class="panel-section-title" label="System" xalign={0} />
          <box class="panel-row" spacing={8}>
            <button onClicked={() => powerOption("reboot")}>reboot</button>
            <button class="danger" onClicked={() => powerOption("shutdown")}>shutdown</button>
          </box>
          <label class="panel-section-title" label="After updates" xalign={0} />
          <box class="panel-row" spacing={8}>
            <button onClicked={() => powerOption("update-reboot")}>update + reboot</button>
            <button onClicked={() => powerOption("update-shutdown")}>update + shutdown</button>
          </box>
        </box>
    </SystemMenuButton>
  )
}
