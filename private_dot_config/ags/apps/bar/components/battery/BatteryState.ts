import Battery from "gi://AstalBattery"
import GLib from "gi://GLib?version=2.0"

import { createBinding, createState } from "ags"

import { getGlobalState } from "../../utils/global-state"

const BATTERY_SYSFS_PATH = "/sys/class/power_supply/BAT0"
const BATTERY_TIME_REFRESH_MS = 30_000

type BatteryTimeEstimate = {
  text: string
  suffix: string
} | null

type BatteryDetails = {
  status: string
  health: string
  cycles: string
}

function readSysfsNumber(path: string) {
  try {
    const [, bytes] = GLib.file_get_contents(path)
    const value = Number.parseInt(new TextDecoder().decode(bytes).trim(), 10)
    return Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}

function readSysfsText(path: string) {
  try {
    const [, bytes] = GLib.file_get_contents(path)
    return new TextDecoder().decode(bytes).trim()
  } catch {
    return ""
  }
}

function formatDuration(hours: number) {
  if (!Number.isFinite(hours) || hours <= 0) {
    return null
  }

  const totalMinutes = Math.max(1, Math.round(hours * 60))
  const wholeHours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (wholeHours <= 0) {
    return `${minutes}m`
  }

  if (minutes <= 0) {
    return `${wholeHours}h`
  }

  return `${wholeHours}h ${minutes}m`
}

function readBatteryTimeEstimate(): BatteryTimeEstimate {
  const status = readSysfsText(`${BATTERY_SYSFS_PATH}/status`)
  const chargeNow = readSysfsNumber(`${BATTERY_SYSFS_PATH}/charge_now`)
  const chargeFull = readSysfsNumber(`${BATTERY_SYSFS_PATH}/charge_full`)
  const currentNow = readSysfsNumber(`${BATTERY_SYSFS_PATH}/current_now`)

  if (!status || !chargeNow || !currentNow || currentNow <= 0) {
    return null
  }

  if (status === "Discharging") {
    const text = formatDuration(chargeNow / currentNow)
    return text ? { text, suffix: "left" } : null
  }

  if (status === "Charging" && chargeFull && chargeFull > chargeNow) {
    const text = formatDuration((chargeFull - chargeNow) / currentNow)
    return text ? { text, suffix: "to full" } : null
  }

  return null
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function readBatteryHealthPercent() {
  const chargeFull = readSysfsNumber(`${BATTERY_SYSFS_PATH}/charge_full`)
  const chargeFullDesign = readSysfsNumber(`${BATTERY_SYSFS_PATH}/charge_full_design`)

  if (chargeFull && chargeFullDesign && chargeFullDesign > 0) {
    return (chargeFull / chargeFullDesign) * 100
  }

  const energyFull = readSysfsNumber(`${BATTERY_SYSFS_PATH}/energy_full`)
  const energyFullDesign = readSysfsNumber(`${BATTERY_SYSFS_PATH}/energy_full_design`)

  if (energyFull && energyFullDesign && energyFullDesign > 0) {
    return (energyFull / energyFullDesign) * 100
  }

  return null
}

function readBatteryDetails(): BatteryDetails {
  const status = readSysfsText(`${BATTERY_SYSFS_PATH}/status`) || "Unavailable"
  const healthPercent = readBatteryHealthPercent()
  const cycleCount = readSysfsNumber(`${BATTERY_SYSFS_PATH}/cycle_count`)

  return {
    status,
    health: healthPercent !== null ? `${formatPercent(healthPercent)} of design capacity` : "Unavailable",
    cycles: cycleCount !== null ? `${cycleCount}` : "Unavailable",
  }
}

/**
 * Returns the shared battery bindings for all battery widgets.
 */
export function getBatteryState() {
  return getGlobalState("bar-battery-state", () => {
    const battery = Battery.get_default()
    const percentage = createBinding(battery, "percentage")
    const iconName = createBinding(battery, "batteryIconName")
    const visible = createBinding(battery, "isBattery")
    const [timeEstimate, setTimeEstimate] = createState<BatteryTimeEstimate>(readBatteryTimeEstimate())
    const [details, setDetails] = createState<BatteryDetails>(readBatteryDetails())

    GLib.timeout_add(GLib.PRIORITY_DEFAULT, BATTERY_TIME_REFRESH_MS, () => {
      setTimeEstimate(readBatteryTimeEstimate())
      setDetails(readBatteryDetails())
      return GLib.SOURCE_CONTINUE
    })

    return {
      percentage,
      iconName,
      visible,
      details,
      text: percentage((value) => `${Math.round(value * 100)}%`),
      tooltip: percentage((value) => {
        const base = `Battery: ${Math.round(value * 100)}%`
        const estimate = timeEstimate.get()

        return estimate ? `${base}, ${estimate.text} ${estimate.suffix}` : base
      }),
      state: percentage((value) => {
        if (value >= 0.95) {
          return "full"
        }

        if (value <= 0.15) {
          return "critical"
        }

        return "normal"
      }),
    }
  })
}
