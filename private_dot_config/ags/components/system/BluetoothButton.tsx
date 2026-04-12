import { For } from "ags"
import { Gtk } from "ags/gtk4"
import { createPoll } from "ags/time"
import { execAsync } from "ags/process"

import { parseBluetoothDevices } from "../../lib/parsers"
import { command, createCommandTextPolls, run } from "../../lib/runtime"
import type { BluetoothDevice } from "../../lib/types"

import SystemMenuButton from "./SystemMenuButton"

type BluetoothButtonProps = {
  instanceId: string
}

/**
 * Polls Bluetooth status and offers a popover for power and device actions.
 */
export default function BluetoothButton({ instanceId }: BluetoothButtonProps) {
  const { icon, tooltip, state } = createCommandTextPolls(
    3000,
    "bar-bluetooth",
    ["icon", "tooltip", "state"] as const,
  )
  const devices = createPoll(new Array<BluetoothDevice>(), 8000, async () => {
    const [allDevices, connectedDevices] = await Promise.all([
      execAsync(["bluetoothctl", "devices"]),
      execAsync(["bluetoothctl", "devices", "Connected"]),
    ])
    return parseBluetoothDevices(allDevices, connectedDevices)
  })
  const popoverId = `bluetooth-popover-${instanceId}`

  return (
    <SystemMenuButton
      popoverId={popoverId}
      tooltipText={tooltip}
      button={
        <box class={state((value) => `bar-item icon-only bt-${value}`)} halign={Gtk.Align.CENTER}>
          <label class="item-icon item-icon-only" label={icon} xalign={0.5} yalign={0.5} />
        </box>
      }
    >
        <box class="panel" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
          <label class="panel-title" label="Bluetooth" xalign={0} />
          <label class="panel-status" label={tooltip} xalign={0} />
          <box class="panel-row" spacing={8}>
            <button onClicked={() => run(command("bar-bluetooth", "toggle-power"))}>Toggle Power</button>
            <button onClicked={() => run(["bluetoothctl", "scan", "on"])}>Scan On</button>
            <button onClicked={() => run(["bluetoothctl", "scan", "off"])}>Scan Off</button>
          </box>
          <label class="panel-section-title" label="Known devices" xalign={0} />
          <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
            <For each={devices}>
              {(device) => (
                <button
                  class={device.connected ? "panel-button occupied" : "panel-button"}
                  onClicked={() =>
                    run(command("bar-bluetooth", device.connected ? "disconnect" : "connect", device.mac))
                  }
                >
                  <label label={device.name} xalign={0} />
                </button>
              )}
            </For>
          </box>
        </box>
    </SystemMenuButton>
  )
}
