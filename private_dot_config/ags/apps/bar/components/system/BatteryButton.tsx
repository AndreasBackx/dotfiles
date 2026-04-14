import Battery from "gi://AstalBattery"

import { createBinding } from "ags"
import { Gtk } from "ags/gtk4"

/**
 * Shows the current battery icon and percentage when a battery is present.
 */
export default function BatteryButton() {
  const battery = Battery.get_default()
  const percentage = createBinding(battery, "percentage")
  const iconName = createBinding(battery, "batteryIconName")
  const visible = createBinding(battery, "isBattery")

  const text = percentage((value) => `${Math.round(value * 100)}%`)
  const tooltip = percentage((value) => `Battery: ${Math.round(value * 100)}%`)
  const state = percentage((value) => {
    if (value >= 0.95) {
      return "success"
    }

    if (value <= 0.15) {
      return "critical"
    }

    return "normal"
  })

  return (
    <box visible={visible}>
      <button class={state((value) => `bar-item with-text battery-${value}`)} tooltipText={tooltip}>
        <box class="system-button-content with-text" halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER}>
          <image iconName={iconName} pixelSize={16} />
          <label class="item-text" label={text} />
        </box>
      </button>
    </box>
  )
}
