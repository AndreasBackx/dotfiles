import Battery from "gi://AstalBattery"

import { createBinding } from "ags"

import { getGlobalState } from "../../utils/global-state"

/**
 * Returns the shared battery bindings for all battery widgets.
 */
export function getBatteryState() {
  return getGlobalState("bar-battery-state", () => {
    const battery = Battery.get_default()
    const percentage = createBinding(battery, "percentage")
    const iconName = createBinding(battery, "batteryIconName")
    const visible = createBinding(battery, "isBattery")

    return {
      percentage,
      iconName,
      visible,
      text: percentage((value) => `${Math.round(value * 100)}%`),
      tooltip: percentage((value) => `Battery: ${Math.round(value * 100)}%`),
      state: percentage((value) => {
        if (value >= 0.95) {
          return "success"
        }

        if (value <= 0.15) {
          return "critical"
        }

        return "normal"
      }),
    }
  })
}
