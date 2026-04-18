import { Gtk } from "ags/gtk4"

import { BIN, run } from "../../utils/runtime"

import SystemMenuButton from "../system/SystemMenuButton"

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
      instanceId={instanceId}
      tooltipText="Power options"
      button={
        <box class="bar-item icon-only" halign={Gtk.Align.CENTER}>
          <label class="item-icon item-icon-only" label="⏻" xalign={0.5} yalign={0.5} />
        </box>
      }
    >
      <box class="panel" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
        <label class="panel-title" label="Power" xalign={0} />
        <label class="panel-section-title" label="Session" xalign={0} />
        <box class="panel-row" spacing={8}>
          <button onClicked={() => powerOption("logout")}>Logout</button>
          <button onClicked={() => powerOption("suspend")}>Suspend</button>
          <button onClicked={() => powerOption("hibernate")}>Hibernate</button>
        </box>
        <label class="panel-section-title" label="System" xalign={0} />
        <box class="panel-row" spacing={8}>
          <button onClicked={() => powerOption("reboot")}>Reboot</button>
          <button class="danger" onClicked={() => powerOption("shutdown")}>Shutdown</button>
        </box>
        <label class="panel-section-title" label="After updates" xalign={0} />
        <box class="panel-row" spacing={8}>
          <button onClicked={() => powerOption("update-reboot")}>Update + Reboot</button>
          <button onClicked={() => powerOption("update-shutdown")}>Update + Shutdown</button>
        </box>
      </box>
    </SystemMenuButton>
  )
}
