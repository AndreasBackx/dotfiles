import { For } from "ags"
import { Gtk } from "ags/gtk4"
import { createPoll } from "ags/time"
import { execAsync } from "ags/process"

import { parseBluetoothDevices } from "../../lib/parsers"
import { attachPopoverHandlers } from "../../lib/widget-helpers"
import { command, createTextPoll, run } from "../../lib/runtime"
import type { BluetoothDevice } from "../../lib/types"

type BluetoothButtonProps = {
  instanceId: string
}

export default function BluetoothButton({ instanceId }: BluetoothButtonProps) {
  const icon = createTextPoll(3000, command("eww-bluetooth", "icon"))
  const tooltip = createTextPoll(3000, command("eww-bluetooth", "tooltip"))
  const state = createTextPoll(3000, command("eww-bluetooth", "state"))
  const devices = createPoll(new Array<BluetoothDevice>(), 8000, async () => {
    const [allDevices, connectedDevices] = await Promise.all([
      execAsync(["bluetoothctl", "devices"]),
      execAsync(["bluetoothctl", "devices", "Connected"]),
    ])
    return parseBluetoothDevices(allDevices, connectedDevices)
  })
  const popoverId = `bluetooth-popover-${instanceId}`

  return (
    <menubutton class="bar-menu-button" tooltipText={tooltip}>
      <box class={state((value) => `bar-item icon-only bt-${value}`)}>
        <label class="item-icon item-icon-only" label={icon} />
      </box>
      <popover $={(self: Gtk.Popover) => attachPopoverHandlers(self, popoverId)}>
        <box class="panel" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
          <label class="panel-title" label="Bluetooth" xalign={0} />
          <label class="panel-status" label={tooltip} xalign={0} />
          <box class="panel-row" spacing={8}>
            <button onClicked={() => run(command("eww-bluetooth", "toggle-power"))}>toggle power</button>
            <button onClicked={() => run(["bluetoothctl", "scan", "on"])}>scan on</button>
            <button onClicked={() => run(["bluetoothctl", "scan", "off"])}>scan off</button>
          </box>
          <label class="panel-section-title" label="Known devices" xalign={0} />
          <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
            <For each={devices}>
              {(device) => (
                <button
                  class={device.connected ? "panel-button occupied" : "panel-button"}
                  onClicked={() =>
                    run(command("eww-bluetooth", device.connected ? "disconnect" : "connect", device.mac))
                  }
                >
                  <label label={device.name} xalign={0} />
                </button>
              )}
            </For>
          </box>
        </box>
      </popover>
    </menubutton>
  )
}
