import Bluetooth from "gi://AstalBluetooth"

import { For } from "ags"
import { createBinding } from "ags"
import { Gtk } from "ags/gtk4"

import { getBluetoothState } from "./BluetoothState"
import SystemMenuButton from "../system/SystemMenuButton"

type BluetoothButtonProps = {
  instanceId: string
}

/**
 * Uses Astal Bluetooth state for power, scanning, and device actions.
 */
export default function BluetoothButton({ instanceId }: BluetoothButtonProps) {
  const { devices, icon, tooltip, state, discovering, togglePower, setScanning, toggleDevice } = getBluetoothState()
  const popoverId = `bluetooth-popover-${instanceId}`

  return (
    <SystemMenuButton
      popoverId={popoverId}
      instanceId={instanceId}
      tooltipText={tooltip}
      button={
        <box class={state((value) => `bar-item icon-only bt-${value}`)} halign={Gtk.Align.CENTER}>
          <image iconName={icon} pixelSize={16} />
        </box>
      }
    >
        <box class="panel" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
          <label class="panel-title" label="Bluetooth" xalign={0} />
          <label class="panel-status" label={tooltip} xalign={0} />
          <box class="panel-row" spacing={8}>
            <button onClicked={togglePower}>Toggle Power</button>
            <button onClicked={() => setScanning(true)}>Scan On</button>
            <button onClicked={() => setScanning(false)}>Scan Off</button>
          </box>
          <label class="panel-status" label={discovering((value) => (value ? "Discovery enabled" : "Discovery idle"))} xalign={0} />
          <label class="panel-section-title" label="Known devices" xalign={0} />
          <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
            <For each={devices}>
              {(device) => (
                <button
                  class={createBinding(device, "connected")((connected) =>
                    connected ? "panel-button occupied" : "panel-button",
                  )}
                  onClicked={() => void toggleDevice(device)}
                >
                  <centerbox orientation={Gtk.Orientation.HORIZONTAL} hexpand>
                    <label $type="start" label={createBinding(device, "alias")} xalign={0} hexpand />
                    <label
                      $type="end"
                      class="panel-status"
                      label={createBinding(device, "batteryPercentage")((value) =>
                        value >= 0 ? `${Math.round(value)}%` : "",
                      )}
                      xalign={1}
                    />
                  </centerbox>
                </button>
              )}
            </For>
          </box>
        </box>
    </SystemMenuButton>
  )
}
