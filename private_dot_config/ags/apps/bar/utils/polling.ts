import GLib from "gi://GLib?version=2.0"

import { createState } from "ags"

import type { StateAccessor } from "../../../common/utils/state"

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
    if (polling) {
      return value.get()
    }

    polling = true

    try {
      const next = await options.poll()
      setValue(next)
      return next
    } finally {
      polling = false
      scheduleNext()
    }
  }

  const handleActivityChange = () => {
    if (options.active.get() && options.refreshOnActive !== false) {
      void refresh()
      return
    }

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
    },
  }
}
