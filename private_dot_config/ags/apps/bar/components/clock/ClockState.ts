import GLib from "gi://GLib?version=2.0"

import { createState } from "ags"
import { execAsync } from "ags/process"

import type { StateAccessor } from "../../../common/utils/state"
import { instanceActive } from "../../utils/activity"
import { getGlobalState } from "../../utils/global-state"
import { createAdaptivePollState } from "../../utils/polling"
import { createAlignedTimeState } from "../../utils/time"
import { trimOutput } from "../../utils/runtime"

type ClockState = {
  time: StateAccessor<string>
  tooltip: StateAccessor<string>
  currentTimezone: StateAccessor<string>
  availableTimezones: StateAccessor<string[]>
  timezoneLoading: StateAccessor<boolean>
  applyTimezone: (timezone: string) => Promise<void>
  attachInstance: (instanceId: string) => () => void
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
    const [activeCount, setActiveCount] = createState(0)
    const active = ((map?: (value: boolean) => boolean) => {
      const value = activeCount.get() > 0
      return typeof map === "function" ? map(value) : value
    }) as StateAccessor<boolean> & { subscribe(callback: () => void): () => void }
    active.get = () => activeCount.get() > 0
    active.subscribe = (callback: () => void) => (activeCount as any).subscribe?.(callback) ?? (() => {})

    // Keep the label aligned to minute boundaries, while the tooltip retains a
    // second-resolution clock for the more detailed panel status text.
    const time = createAlignedTimeState(() => formatLocalTime("%a %d %b %H:%M"), 60_000)
    const tooltipPoller = createAdaptivePollState(formatLocalTime("%a %d %b %Y %H:%M:%S %Z"), {
      active,
      visibleIntervalMs: 1000,
      hiddenIntervalMs: null,
      poll: () => formatLocalTime("%a %d %b %Y %H:%M:%S %Z"),
    })
    const [currentTimezone, setCurrentTimezone] = createState("")
    const [availableTimezones, setAvailableTimezones] = createState(new Array<string>())
    const [timezoneLoading, setTimezoneLoading] = createState(true)
    const attachedInstances = new Map<string, { refs: number; active: boolean; dispose: () => void }>()

    const updateActiveCount = () => {
      setActiveCount([...attachedInstances.values()].filter((entry) => entry.active).length)
    }

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
      tooltip: tooltipPoller.value,
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
      attachInstance: (instanceId: string) => {
        const detach = () => {
          const current = attachedInstances.get(instanceId)
          if (!current) {
            return
          }

          current.refs -= 1
          if (current.refs > 0) {
            return
          }

          current.dispose()
          attachedInstances.delete(instanceId)
          updateActiveCount()
        }

        const existing = attachedInstances.get(instanceId)
        if (existing) {
          existing.refs += 1
          return detach
        }

        const instance = instanceActive(instanceId) as StateAccessor<boolean> & {
          subscribe?: (callback: () => void) => () => void
        }
        const entry = {
          refs: 1,
          active: instance.get(),
          dispose: instance.subscribe?.(() => {
            entry.active = instance.get()
            updateActiveCount()
          }) ?? (() => {}),
        }

        attachedInstances.set(instanceId, entry)
        updateActiveCount()
        return detach
      },
    }
  })
}
