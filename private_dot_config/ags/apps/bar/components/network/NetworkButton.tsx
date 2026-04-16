import Network from "gi://AstalNetwork"

import { For } from "ags"
import { Gtk } from "ags/gtk4"

import { run } from "../../utils/runtime"
import { getNetworkState } from "./NetworkState"

import SystemMenuButton from "../system/SystemMenuButton"

/**
 * Formats a compact Wi-Fi label for the popover list.
 */
function wifiLabel(accessPoint: Network.AccessPoint) {
  return accessPoint.ssid || "Hidden network"
}

function wifiMeta(accessPoint: Network.AccessPoint) {
  return `${accessPoint.strength}%${accessPoint.requiresPassword ? " 🔒" : ""}`
}

type NetworkButtonProps = {
  instanceId: string
}

/**
 * Uses Astal NetworkManager state for Wi-Fi status and access-point actions.
 */
export default function NetworkButton({ instanceId }: NetworkButtonProps) {
  const { iconName, tooltip, state, visible, accessPoints, activeAccessPoint, toggleWifi, disconnectWifi, connectWifi, scan } = getNetworkState()
  const popoverId = `network-popover-${instanceId}`

  return (
    <box visible={visible}>
      <SystemMenuButton
        popoverId={popoverId}
        instanceId={instanceId}
        tooltipText={tooltip}
        button={
          <box class={state((value) => `bar-item icon-only net-${value}`)} halign={Gtk.Align.CENTER}>
            <image iconName={iconName} pixelSize={16} />
          </box>
        }
      >
        <box class="panel" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
          <label class="panel-title" label="Network" xalign={0} />
          <label class="panel-status" label={tooltip} xalign={0} />
          <box class="panel-row" spacing={8}>
            <button onClicked={toggleWifi}>Toggle Networking</button>
            <button onClicked={() => run(["nm-connection-editor"])}>Connections</button>
            <button onClicked={scan}>Scan</button>
          </box>
          <label class="panel-section-title" label="Wi-Fi" xalign={0} />
          <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
            <For each={accessPoints}>
              {(accessPoint) => (
                <button
                  class={activeAccessPoint((active: Network.AccessPoint | null) =>
                    active === accessPoint ? "panel-button occupied" : "panel-button",
                  )}
                  onClicked={() => {
                    if (activeAccessPoint.get() === accessPoint) {
                      void disconnectWifi()
                    } else {
                      void connectWifi(accessPoint)
                    }
                  }}
                >
                  <centerbox orientation={Gtk.Orientation.HORIZONTAL} hexpand>
                    <label $type="start" label={wifiLabel(accessPoint)} xalign={0} hexpand />
                    <label $type="end" class="panel-status" label={wifiMeta(accessPoint)} xalign={1} />
                  </centerbox>
                </button>
              )}
            </For>
          </box>
        </box>
      </SystemMenuButton>
    </box>
  )
}
