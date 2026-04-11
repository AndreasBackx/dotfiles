import { For } from "ags"
import { Gtk } from "ags/gtk4"
import { createPoll } from "ags/time"
import { execAsync } from "ags/process"

import { parseWifiAccessPoints } from "../../lib/parsers"
import { attachPopoverHandlers } from "../../lib/widget-helpers"
import { command, createTextPoll, run, shell } from "../../lib/runtime"
import type { WifiAccessPoint } from "../../lib/types"

function connectWifi(ssid: string) {
  run(shell(`nmcli d wifi connect '${ssid.replace(/'/g, "'\\''")}'`))
}

export default function NetworkButton() {
  const icon = createTextPoll(3000, command("eww-network", "icon"))
  const tooltip = createTextPoll(3000, command("eww-network", "tooltip"))
  const state = createTextPoll(3000, command("eww-network", "state"))
  const wifi = createPoll(new Array<WifiAccessPoint>(), 8000, async () => {
    const stdout = await execAsync([
      "nmcli",
      "-t",
      "-f",
      "IN-USE,BSSID,SSID,SIGNAL,SECURITY",
      "dev",
      "wifi",
      "list",
      "--rescan",
      "auto",
    ])
    return parseWifiAccessPoints(stdout)
  })

  return (
    <menubutton class="bar-menu-button" tooltipText={tooltip}>
      <box class={state((value) => `bar-item icon-only net-${value}`)}>
        <label class="item-icon item-icon-only" label={icon} />
      </box>
      <popover $={(self: Gtk.Popover) => attachPopoverHandlers(self)}>
        <box class="panel" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
          <label class="panel-title" label="Network" xalign={0} />
          <label class="panel-status" label={tooltip} xalign={0} />
          <box class="panel-row" spacing={8}>
            <button onClicked={() => run(command("eww-network", "toggle-network"))}>toggle networking</button>
            <button onClicked={() => run(command("eww-network", "connections"))}>connections</button>
          </box>
          <label class="panel-section-title" label="Wi-Fi" xalign={0} />
          <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
            <For each={wifi}>
              {(accessPoint) => (
                <button
                  class={accessPoint.inUse ? "panel-button occupied" : "panel-button"}
                  onClicked={() => {
                    if (accessPoint.inUse) {
                      run(command("eww-network", "disconnect-wifi"))
                    } else {
                      connectWifi(accessPoint.ssid)
                    }
                  }}
                >
                  <label
                    label={`${accessPoint.ssid} (${accessPoint.signal}%${accessPoint.security ? " 🔒" : ""})`}
                    xalign={0}
                  />
                </button>
              )}
            </For>
          </box>
        </box>
      </popover>
    </menubutton>
  )
}
