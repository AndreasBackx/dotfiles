import { For } from "ags"
import { Gtk } from "ags/gtk4"
import { createPoll } from "ags/time"
import { execAsync } from "ags/process"

import { parseWifiAccessPoints } from "../../lib/parsers"
import { command, createCommandTextPolls, run, shell } from "../../lib/runtime"
import type { WifiAccessPoint } from "../../lib/types"

import SystemMenuButton from "./SystemMenuButton"

/**
 * Connects to a Wi-Fi network using `nmcli` while preserving single quotes in
 * the SSID.
 */
function connectWifi(ssid: string) {
  run(shell(`nmcli d wifi connect '${ssid.replace(/'/g, "'\\''")}'`))
}

/**
 * Formats a compact Wi-Fi label for the popover list.
 */
function wifiLabel(accessPoint: WifiAccessPoint) {
  return `${accessPoint.ssid} (${accessPoint.signal}%${accessPoint.security ? " 🔒" : ""})`
}

type NetworkButtonProps = {
  instanceId: string
}

/**
 * Polls network status and lists visible Wi-Fi access points in a popover.
 */
export default function NetworkButton({ instanceId }: NetworkButtonProps) {
  const { icon, tooltip, state } = createCommandTextPolls(3000, "eww-network", ["icon", "tooltip", "state"] as const)
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
  const popoverId = `network-popover-${instanceId}`

  return (
    <SystemMenuButton
      popoverId={popoverId}
      tooltipText={tooltip}
      button={
        <box class={state((value) => `bar-item icon-only net-${value}`)}>
          <label class="item-icon item-icon-only" label={icon} />
        </box>
      }
    >
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
                  <label label={wifiLabel(accessPoint)} xalign={0} />
                </button>
              )}
            </For>
          </box>
        </box>
    </SystemMenuButton>
  )
}
