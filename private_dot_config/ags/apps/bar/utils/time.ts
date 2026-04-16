import GLib from "gi://GLib?version=2.0"

import { createState } from "ags"

import type { StateAccessor } from "../../../common/utils/state"

function millisecondsUntilNextBoundary(periodMs: number) {
  const remainder = Date.now() % periodMs
  return remainder === 0 ? periodMs : periodMs - remainder
}

/**
 * Returns a shared formatted time accessor that snaps updates to exact
 * wall-clock boundaries for the provided period.
 *
 * This is used for the clock label so `%H:%M` ticks exactly when the real clock
 * rolls over to the next minute instead of drifting from a fixed interval that
 * happened to start at app launch.
 *
 * The implementation deliberately reschedules from the current wall-clock time
 * after every tick. That keeps it aligned even if the process stalls briefly or
 * the system wakes from sleep.
 */
export function createAlignedTimeState(formatter: () => string, periodMs: number): StateAccessor<string> {
  const [value, setValue] = createState(formatter())

  const scheduleNextTick = () => {
    // Use one-shot timeouts instead of a repeating interval so every update is
    // aligned to the next real boundary, not to the previous callback's finish
    // time.
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, millisecondsUntilNextBoundary(periodMs), () => {
      setValue(formatter())
      scheduleNextTick()
      return GLib.SOURCE_REMOVE
    })
  }

  scheduleNextTick()
  return value
}
