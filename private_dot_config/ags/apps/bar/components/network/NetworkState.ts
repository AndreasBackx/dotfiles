import Network from "gi://AstalNetwork"

import { createBinding, createState } from "ags"

import type { StateAccessor } from "../../../common/utils/state"
import { getGlobalState } from "../../utils/global-state"

type NetworkStateValue = {
  iconName: StateAccessor<string>
  tooltip: StateAccessor<string>
  state: StateAccessor<string>
  visible: StateAccessor<boolean>
  accessPoints: any
  activeAccessPoint: any
  toggleWifi: () => void
  disconnectWifi: () => Promise<void>
  connectWifi: (accessPoint: Network.AccessPoint) => Promise<void>
  scan: () => void
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

/**
 * Returns the shared NetworkManager-backed state for all network widgets.
 */
export function getNetworkState(): NetworkStateValue {
  return getGlobalState("bar-network-state", () => {
    const network = Network.get_default()
    const wifi = network.wifi
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

    if (wifi) {
      wifi.connect("notify::enabled", syncWifiState)
      wifi.connect("notify::scanning", syncWifiState)
      wifi.connect("notify::ssid", syncWifiState)
      wifi.connect("notify::internet", syncWifiState)
      wifi.connect("notify::strength", syncWifiState)
      wifi.connect("notify::icon-name", syncWifiState)
    }

    syncWifiState()

    const accessPoints = wifi
      ? createBinding(wifi, "accessPoints")((points) =>
          [...points].filter((point) => Boolean(point.ssid)).sort((left, right) => right.strength - left.strength),
        )
      : createState(new Array<Network.AccessPoint>())[0]
    const activeAccessPoint = wifi ? createBinding(wifi, "activeAccessPoint") : createState<Network.AccessPoint | null>(null)[0]

    return {
      iconName,
      tooltip,
      state,
      visible,
      accessPoints,
      activeAccessPoint,
      toggleWifi: () => {
        if (wifi) {
          wifi.enabled = !wifi.enabled
        }
      },
      disconnectWifi: async () => {
        if (!wifi) {
          return
        }

        try {
          await wifi.deactivate_connection()
        } catch (error) {
          console.error(error)
        }
      },
      connectWifi: async (accessPoint: Network.AccessPoint) => {
        try {
          await accessPoint.activate()
        } catch (error) {
          console.error(error)
        }
      },
      scan: () => {
        wifi?.scan()
      },
    }
  })
}
