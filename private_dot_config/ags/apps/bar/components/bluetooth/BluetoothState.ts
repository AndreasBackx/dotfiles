import Bluetooth from "gi://AstalBluetooth"

import { createBinding, createState } from "ags"

import type { StateAccessor } from "../../../common/utils/state"
import { getGlobalState } from "../../utils/global-state"

type BluetoothStateValue = {
  devices: any
  icon: StateAccessor<string>
  tooltip: StateAccessor<string>
  state: StateAccessor<string>
  discovering: StateAccessor<boolean>
  togglePower: () => void
  setScanning: (next: boolean) => void
  toggleDevice: (device: Bluetooth.Device) => Promise<void>
}

function deviceLabel(device: Bluetooth.Device) {
  return device.alias || device.name || ""
}

function runDeviceAction(
  start: (callback: (self: Bluetooth.Device, result: unknown) => void) => void,
  finish: (result: unknown) => void,
) {
  return new Promise<void>((resolve, reject) => {
    try {
      start((_self, result) => {
        try {
          finish(result)
          resolve()
        } catch (error) {
          reject(error)
        }
      })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Returns the shared Bluetooth state for all bar instances.
 */
export function getBluetoothState(): BluetoothStateValue {
  return getGlobalState("bar-bluetooth-state", () => {
    const bluetooth = Bluetooth.get_default()
    const devices = createBinding(bluetooth, "devices")((items) =>
      [...items]
        .filter((device) => Boolean(deviceLabel(device)))
        .sort(
          (left, right) => Number(right.connected) - Number(left.connected) || deviceLabel(left).localeCompare(deviceLabel(right)),
        ),
    )
    const [icon, setIcon] = createState("bluetooth-disabled-symbolic")
    const [tooltip, setTooltip] = createState("Bluetooth unavailable")
    const [state, setState] = createState("off")
    const [discovering, setDiscovering] = createState(false)

    let trackedAdapter: Bluetooth.Adapter | null = null
    let discoveringSignalId = 0

    const disconnectAdapterSignal = () => {
      if (trackedAdapter && discoveringSignalId) {
        trackedAdapter.disconnect(discoveringSignalId)
      }

      trackedAdapter = null
      discoveringSignalId = 0
    }

    const syncState = () => {
      const adapter = bluetooth.adapter
      setDiscovering(Boolean(adapter?.discovering))

      if (!adapter || !bluetooth.isPowered) {
        setIcon("bluetooth-disabled-symbolic")
        setTooltip("Bluetooth off")
        setState("off")
        return
      }

      if (adapter.discovering) {
        setIcon("bluetooth-active-symbolic")
        setTooltip("Bluetooth scanning")
        setState("on")
        return
      }

      if (bluetooth.isConnected) {
        const connected = bluetooth.devices.find((device) => device.connected)
        setIcon("bluetooth-active-symbolic")
        setTooltip(`Bluetooth: ${connected?.alias || connected?.name || "Connected"}`)
        setState("on")
        return
      }

      setIcon("bluetooth-symbolic")
      setTooltip("Bluetooth on")
      setState("on")
    }

    const trackAdapter = () => {
      const adapter = bluetooth.adapter
      if (adapter === trackedAdapter) {
        syncState()
        return
      }

      disconnectAdapterSignal()
      trackedAdapter = adapter

      if (adapter) {
        discoveringSignalId = adapter.connect("notify::discovering", syncState)
      }

      syncState()
    }

    bluetooth.connect("notify::is-powered", trackAdapter)
    bluetooth.connect("notify::is-connected", syncState)
    bluetooth.connect("notify::devices", syncState)
    bluetooth.connect("notify::adapter", trackAdapter)

    trackAdapter()

    return {
      devices,
      icon,
      tooltip,
      state,
      discovering,
      togglePower: () => bluetooth.toggle(),
      setScanning: (next: boolean) => {
        const adapter = bluetooth.adapter
        if (!adapter) {
          return
        }

        try {
          if (next) {
            adapter.start_discovery()
          } else {
            adapter.stop_discovery()
          }
        } catch (error) {
          console.error(error)
        }
      },
      toggleDevice: async (device: Bluetooth.Device) => {
        try {
          if (device.connected) {
            await runDeviceAction(
              (callback) => device.disconnect_device(callback),
              (result) => device.disconnect_device_finish(result as any),
            )
          } else {
            await runDeviceAction(
              (callback) => device.connect_device(callback),
              (result) => device.connect_device_finish(result as any),
            )
          }

          syncState()
        } catch (error) {
          console.error(error)
        }
      },
    }
  })
}
