import GLib from "gi://GLib?version=2.0"

import { createState } from "ags"

import type { StateAccessor } from "../../../common/utils/state"
import { logShowCenterStage } from "./perf"

type SubscribableAccessor<T> = StateAccessor<T> & {
  subscribe?: (callback: () => void) => () => void
}

type AdaptivePollOptions<T> = {
  active: SubscribableAccessor<boolean>
  poll: () => T | Promise<T>
  visibleIntervalMs: number
  hiddenIntervalMs?: number | null
  refreshOnActive?: boolean
}

/**
 * Creates a visibility-aware poller that can run fast while active and either
 * slow down or pause entirely while inactive.
 *
 * The helper uses one-shot timeouts so cadence can change immediately when the
 * activity state flips. Consumers can also force an immediate refresh after a
 * local action instead of waiting for the next scheduled tick.
 */
export function createAdaptivePollState<T>(initial: T, options: AdaptivePollOptions<T>) {
  const [value, setValue] = createState(initial)
  let timeoutId = 0
  let activationRefreshId = 0
  let polling = false

  const clearTimer = () => {
    if (timeoutId > 0) {
      try {
        GLib.source_remove(timeoutId)
      } catch {
        // Timer may already have been removed as part of shutdown/reload.
      }
      timeoutId = 0
    }
  }

  const clearActivationRefresh = () => {
    if (activationRefreshId > 0) {
      try {
        GLib.source_remove(activationRefreshId)
      } catch {
        // Idle source may already have been removed during shutdown/reload.
      }
      activationRefreshId = 0
    }
  }

  const scheduleNext = () => {
    clearTimer()

    const interval = options.active.get()
      ? options.visibleIntervalMs
      : options.hiddenIntervalMs === undefined
        ? null
        : options.hiddenIntervalMs

    if (interval == null) {
      return
    }

    timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, interval, () => {
      void refresh()
      return GLib.SOURCE_REMOVE
    })
  }

  const refresh = async () => {
    logShowCenterStage("adaptive poll refresh enter")
    clearActivationRefresh()

    if (polling) {
      return value.get()
    }

    polling = true

    try {
      const next = await options.poll()
      logShowCenterStage("adaptive poll refresh resolved")
      setValue(next)
      return next
    } finally {
      polling = false
      scheduleNext()
    }
  }

  const scheduleActivationRefresh = () => {
    if (activationRefreshId > 0) {
      return
    }

    logShowCenterStage("adaptive poll activation scheduled")
    activationRefreshId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
      activationRefreshId = 0
      logShowCenterStage("adaptive poll activation fired")

      if (!options.active.get()) {
        return GLib.SOURCE_REMOVE
      }

      void refresh()
      return GLib.SOURCE_REMOVE
    })
  }

  const handleActivityChange = () => {
    if (options.active.get() && options.refreshOnActive !== false) {
      logShowCenterStage("adaptive poll activity active")
      scheduleActivationRefresh()
      return
    }

    clearActivationRefresh()
    scheduleNext()
  }

  const unsubscribe = options.active.subscribe?.(handleActivityChange) ?? (() => {})
  handleActivityChange()

  return {
    value,
    refresh,
    cleanup: () => {
      unsubscribe()
      clearTimer()
      clearActivationRefresh()
    },
  }
}
