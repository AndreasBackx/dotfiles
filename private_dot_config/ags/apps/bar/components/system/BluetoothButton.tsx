import Bluetooth from "gi://AstalBluetooth"

import { For } from "ags"
import { createBinding, createState, onCleanup } from "ags"
import { Gtk } from "ags/gtk4"

import SystemMenuButton from "./SystemMenuButton"

type BluetoothButtonProps = {
  instanceId: string
}

/**
 * Uses Astal Bluetooth state for power, scanning, and device actions.
 */
export default function BluetoothButton({ instanceId }: BluetoothButtonProps) {
  const bluetooth = Bluetooth.get_default()
  const devices = createBinding(bluetooth, "devices")((items) =>
    [...items]
      .filter((device) => Boolean(device.alias || device.name))
      .sort((left, right) => Number(right.connected) - Number(left.connected) || left.alias.localeCompare(right.alias)),
  )
  const popoverId = `bluetooth-popover-${instanceId}`

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

  const bluetoothSignalIds = [
    bluetooth.connect("notify::is-powered", trackAdapter),
    bluetooth.connect("notify::is-connected", syncState),
    bluetooth.connect("notify::devices", syncState),
    bluetooth.connect("notify::adapter", trackAdapter),
  ]

  trackAdapter()

  onCleanup(() => {
    for (const id of bluetoothSignalIds) {
      bluetooth.disconnect(id)
    }

    disconnectAdapterSignal()
  })

  const togglePower = () => bluetooth.toggle()

  const setScanning = (next: boolean) => {
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
  }

  const toggleDevice = async (device: Bluetooth.Device) => {
    try {
      if (device.connected) {
        await device.disconnect_device()
      } else {
        await device.connect_device()
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <SystemMenuButton
      popoverId={popoverId}
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
                        value >= 0 ? `${Math.round(value * 100)}%` : "",
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
