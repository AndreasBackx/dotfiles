import { onCleanup } from "ags"
import { Gtk } from "ags/gtk4"

import { getBackupState } from "./BackupState"
import SystemMenuButton from "../system/SystemMenuButton"

type BackupButtonProps = {
  instanceId: string
}

/**
 * Shows machine backup state and exposes quick backup actions.
 */
export default function BackupButton({ instanceId }: BackupButtonProps) {
  const { iconName, tooltip, state, visible, initBackup, startNow, stop, openLogs, attachInstance } = getBackupState()
  const detach = attachInstance(instanceId)
  const popoverId = `backup-popover-${instanceId}`

  onCleanup(() => {
    detach()
  })

  return (
    <box visible={visible}>
      <SystemMenuButton
        popoverId={popoverId}
        instanceId={instanceId}
        tooltipText={tooltip}
        button={
          <box class={state((value) => `bar-item icon-only backup-${value}`)} halign={Gtk.Align.CENTER}>
            <image iconName={iconName} pixelSize={16} />
          </box>
        }
      >
        <box class="panel backup-panel" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
          <label class="panel-title" label="Backups" xalign={0} />
          <label class="panel-status" label={tooltip} wrap xalign={0} />
          <label class="panel-section-title" label="Actions" xalign={0} />
          <box class="panel-row" spacing={8}>
            <button onClicked={() => void startNow()}>Start now</button>
            <button onClicked={() => void stop()}>Stop</button>
            <button onClicked={() => void openLogs()}>Open logs</button>
          </box>
          <box class="panel-row" spacing={8} visible={state((value) => value === "uninitialized")}>
            <button onClicked={() => void initBackup()}>Run init</button>
          </box>
        </box>
      </SystemMenuButton>
    </box>
  )
}
