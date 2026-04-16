import GLib from "gi://GLib?version=2.0"

import { createState } from "ags"
import { execAsync } from "ags/process"

import type { StateAccessor } from "../../../common/utils/state"
import { getGlobalState } from "../../utils/global-state"
import { createAlignedTimeState } from "../../utils/time"
import { trimOutput } from "../../utils/runtime"

type ClockState = {
  time: StateAccessor<string>
  tooltip: StateAccessor<string>
  currentTimezone: StateAccessor<string>
  availableTimezones: StateAccessor<string[]>
  timezoneLoading: StateAccessor<boolean>
  applyTimezone: (timezone: string) => Promise<void>
}

function parseTimezones(stdout: string) {
  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

function formatLocalTime(pattern: string) {
  return GLib.DateTime.new_now_local().format(pattern) ?? ""
}

async function readCurrentTimezone() {
  return trimOutput(await execAsync(["timedatectl", "show", "--property=Timezone", "--value"]))
}

/**
 * Returns the app-wide clock state shared by every `ClockButton` instance.
 *
 * Without this singleton, each visible bar window would create its own clock
 * timer, second-resolution tooltip timer, timezone query, and timezone list
 * load. Sharing the state keeps the widget cheap on multi-monitor setups while
 * still letting each button manage its own local popover UI state.
 */
export function getClockState(): ClockState {
  return getGlobalState("bar-clock-state", () => {
    // Keep the label aligned to minute boundaries, while the tooltip retains a
    // second-resolution clock for the more detailed panel status text.
    const time = createAlignedTimeState(() => formatLocalTime("%a %d %b %H:%M"), 60_000)
    const tooltip = createAlignedTimeState(() => formatLocalTime("%a %d %b %Y %H:%M:%S %Z"), 1_000)
    const [currentTimezone, setCurrentTimezone] = createState("")
    const [availableTimezones, setAvailableTimezones] = createState(new Array<string>())
    const [timezoneLoading, setTimezoneLoading] = createState(true)

    const refreshCurrentTimezone = async () => {
      try {
        setCurrentTimezone(await readCurrentTimezone())
      } catch (error) {
        console.error(error)
      } finally {
        setTimezoneLoading(false)
      }
    }

    // Warm both timezone sources immediately so the first clock popover opens
    // with populated data instead of each instance racing its own `timedatectl`
    // calls.
    void refreshCurrentTimezone()
    execAsync(["timedatectl", "list-timezones"])
      .then((stdout) => setAvailableTimezones(parseTimezones(stdout)))
      .catch((error) => console.error(error))

    return {
      time,
      tooltip,
      currentTimezone,
      availableTimezones,
      timezoneLoading,
      applyTimezone: async (nextTimezone: string) => {
        if (!nextTimezone || nextTimezone === currentTimezone.get()) {
          return
        }

        // The shared state owns the authoritative timezone value, so changing it
        // here updates every clock instance automatically after the command
        // succeeds.
        setTimezoneLoading(true)

        try {
          await execAsync(["timedatectl", "set-timezone", nextTimezone])
          await refreshCurrentTimezone()
        } catch (error) {
          setTimezoneLoading(false)
          console.error(error)
          throw error
        }
      },
    }
  })
}
