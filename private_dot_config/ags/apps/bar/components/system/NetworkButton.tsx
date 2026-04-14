import Network from "gi://AstalNetwork"

import { For } from "ags"
import { createBinding, createState, onCleanup } from "ags"
import { Gtk } from "ags/gtk4"

import { run } from "../../utils/runtime"

import SystemMenuButton from "./SystemMenuButton"

/**
 * Formats a compact Wi-Fi label for the popover list.
 */
function wifiLabel(accessPoint: Network.AccessPoint) {
  return accessPoint.ssid || "Hidden network"
}

function wifiMeta(accessPoint: Network.AccessPoint) {
  return `${accessPoint.strength}%${accessPoint.requiresPassword ? " 🔒" : ""}`
}

function internetLabel(internet: Network.Internet) {
  switch (internet) {
    case Network.Internet.CONNECTED:
      return "connected"
    case Network.Internet.CONNECTING:
      return "connecting"
    default:
      return "disconnected"
  }
}

type NetworkButtonProps = {
  instanceId: string
}

/**
 * Uses Astal NetworkManager state for Wi-Fi status and access-point actions.
 */
export default function NetworkButton({ instanceId }: NetworkButtonProps) {
  const network = Network.get_default()
  const wifi = network.wifi
  const popoverId = `network-popover-${instanceId}`

  const [iconName, setIconName] = createState("network-wireless-offline-symbolic")
  const [tooltip, setTooltip] = createState("Wi-Fi unavailable")
  const [state, setState] = createState("offline")
  const [visible, setVisible] = createState(Boolean(wifi))

  const syncWifiState = () => {
    if (!wifi) {
      setVisible(false)
      setIconName("network-wireless-offline-symbolic")
      setTooltip("Wi-Fi unavailable")
      setState("offline")
      return
    }

    setVisible(true)
    setIconName(wifi.iconName || "network-wireless-offline-symbolic")

    if (!wifi.enabled) {
      setTooltip("Wi-Fi disabled")
      setState("offline")
      return
    }

    if (wifi.scanning) {
      setTooltip("Scanning for networks")
      setState("connecting")
      return
    }

    const ssid = wifi.ssid || "Not connected"
    const suffix = wifi.internet === Network.Internet.CONNECTED ? `${wifi.strength}%` : internetLabel(wifi.internet)
    setTooltip(`Wi-Fi: ${ssid} (${suffix})`)
    setState(wifi.internet === Network.Internet.DISCONNECTED ? "offline" : "online")
  }

  const wifiSignalIds = wifi
    ? [
        wifi.connect("notify::enabled", syncWifiState),
        wifi.connect("notify::scanning", syncWifiState),
        wifi.connect("notify::ssid", syncWifiState),
        wifi.connect("notify::internet", syncWifiState),
        wifi.connect("notify::strength", syncWifiState),
        wifi.connect("notify::icon-name", syncWifiState),
      ]
    : []

  syncWifiState()

  onCleanup(() => {
    for (const id of wifiSignalIds) {
      wifi?.disconnect(id)
    }
  })

  const accessPoints = wifi
    ? createBinding(wifi, "accessPoints")((points) =>
        [...points].filter((point) => Boolean(point.ssid)).sort((left, right) => right.strength - left.strength),
      )
    : []

  const toggleWifi = () => {
    if (wifi) {
      wifi.enabled = !wifi.enabled
    }
  }

  const disconnectWifi = async () => {
    if (!wifi) {
      return
    }

    try {
      await wifi.deactivate_connection()
    } catch (error) {
      console.error(error)
    }
  }

  const connectWifi = async (accessPoint: Network.AccessPoint) => {
    try {
      await accessPoint.activate()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <box visible={visible}>
      <SystemMenuButton
        popoverId={popoverId}
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
            <button onClicked={() => wifi?.scan()}>Scan</button>
          </box>
          <label class="panel-section-title" label="Wi-Fi" xalign={0} />
          <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
            <For each={accessPoints}>
              {(accessPoint) => (
                <button
                  class={createBinding(wifi!, "activeAccessPoint")((active) =>
                    active === accessPoint ? "panel-button occupied" : "panel-button",
                  )}
                  onClicked={() => {
                    if (wifi?.activeAccessPoint === accessPoint) {
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
