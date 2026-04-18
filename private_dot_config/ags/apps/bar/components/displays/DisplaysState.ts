import AstalDisplays from "gi://DisplaysAstal?version=0.1"
import Gio from "gi://Gio?version=2.0"
import { Accessor } from "gnim"

import { createState } from "ags"

import type { StateAccessor } from "../../../common/utils/state"
import { instanceActive } from "../../utils/activity"
import { getGlobalState } from "../../utils/global-state"
import { createPerfSpan, logShowCenterStage } from "../../utils/perf"
import { createAdaptivePollState } from "../../utils/polling"
import type { MonitorIdentity } from "../../utils/types"

const DISPLAY_BRIGHTNESS_STEP = 5

Gio._promisify(AstalDisplays.Manager.prototype, "query_async", "query_finish")
Gio._promisify(AstalDisplays.Manager.prototype, "update_async", "update_finish")

export type DisplayBrightnessItem = {
  key: string
  name: string
  serial: string
  brightness: number
}

export type DisplayErrorMap = Record<string, string>

type DisplaysSnapshot = {
  items: DisplayBrightnessItem[]
  visible: boolean
  tooltip: string
}

type DisplaysState = {
  items: StateAccessor<DisplayBrightnessItem[]>
  visible: StateAccessor<boolean>
  tooltip: StateAccessor<string>
  displayErrors: StateAccessor<DisplayErrorMap>
  attachInstance: (instanceId: string) => () => void
  refresh: () => Promise<DisplaysSnapshot | null>
  applyBrightness: (targetItems: DisplayBrightnessItem[], requestedBrightness: number, minimumBrightness: number) => Promise<void>
}

type SubscribableAccessor<T> = StateAccessor<T> & {
  subscribe?: (callback: () => void) => () => void
}

function getProperty<T>(value: any, ...keys: string[]) {
  for (const key of keys) {
    if (value && typeof value === "object" && key in value && value[key] != null) {
      return value[key] as T
    }

    if (value && typeof value.get_property === "function") {
      try {
        const propertyValue = value.get_property(key)
        if (propertyValue != null) {
          return propertyValue as T
        }
      } catch {
        // Ignore missing GI properties so we can try fallback names.
      }
    }
  }

  return null
}

function buildDisplayKey(name: string, serial: string) {
  return serial || name || "Unknown display"
}

function buildDisplayKeyFromIdentifier(identifier: any) {
  if (!identifier) {
    return null
  }

  const name = getProperty<string>(identifier, "name") || ""
  const serial = getProperty<string>(identifier, "serialNumber", "serial-number", "serial_number") || ""
  return buildDisplayKey(name, serial)
}

function listModelItems(model: any) {
  if (!model) {
    return []
  }

  const count = typeof model.get_n_items === "function" ? model.get_n_items() : 0
  const items = new Array<any>()
  for (let index = 0; index < count; index += 1) {
    items.push(typeof model.get_item === "function" ? model.get_item(index) : null)
  }

  return items.filter((item) => item != null)
}

function buildDisplayItem(display: any): DisplayBrightnessItem | null {
  const identifier = getProperty<any>(display, "id")
  const physical = getProperty<any>(display, "physical")
  const brightness = getProperty<number>(physical, "brightness")

  if (!physical || typeof brightness !== "number") {
    return null
  }

  const name = getProperty<string>(identifier, "name") || "Unknown display"
  const serial = getProperty<string>(identifier, "serialNumber", "serial-number", "serial_number") || ""

  return {
    key: buildDisplayKey(name, serial),
    name,
    serial,
    brightness,
  }
}

function buildDisplayIdentifier(item: DisplayBrightnessItem) {
  return new AstalDisplays.DisplayIdentifier({
    name: item.name || null,
    serial_number: item.serial || null,
  })
}

function pickSnapshotField<T>(snapshot: SubscribableAccessor<DisplaysSnapshot>, selector: (value: DisplaysSnapshot) => T) {
  return new Accessor(() => selector(snapshot.get()), (callback) => snapshot.subscribe?.(callback) ?? (() => {})) as StateAccessor<T>
}

export function averageBrightness(items: DisplayBrightnessItem[]) {
  if (items.length === 0) {
    return 0
  }

  const sum = items.reduce((total, item) => total + item.brightness, 0)
  return Math.round(sum / items.length)
}

export function itemLabel(item: DisplayBrightnessItem) {
  return item.name || item.serial || "Unknown display"
}

export function clampBrightness(value: number, minimumBrightness: number) {
  const rounded = Math.round(value / DISPLAY_BRIGHTNESS_STEP) * DISPLAY_BRIGHTNESS_STEP
  return Math.max(minimumBrightness, Math.min(100, rounded))
}

export function brightnessSummaryForMonitor(items: DisplayBrightnessItem[], monitor: MonitorIdentity) {
  if (items.length === 0) {
    return "--"
  }

  const matchingItem = items.find((item) => {
    if (monitor.serial && item.serial && item.serial === monitor.serial) {
      return true
    }

    if (monitor.description) {
      const description = monitor.description.toLowerCase()
      if (item.name && description.includes(item.name.toLowerCase())) {
        return true
      }
      if (item.serial && description.includes(item.serial.toLowerCase())) {
        return true
      }
    }

    return false
  })

  if (matchingItem) {
    return `${matchingItem.brightness}%`
  }

  return items.length === 1 ? `${items[0].brightness}%` : `${averageBrightness(items)}%`
}

/**
 * Returns the app-wide AstalDisplays state shared by every `DisplaysButton`.
 */
export function getDisplaysState(): DisplaysState {
  return getGlobalState("bar-displays-state", () => {
    logShowCenterStage("displays state factory enter")
    const resolveManager = createPerfSpan("displays state manager.get_default")
    const manager = AstalDisplays.Manager.get_default() as any
    resolveManager()
    const [activeCount, setActiveCount] = createState(0)
    const [displayErrors, setDisplayErrors] = createState<DisplayErrorMap>({})
    const active = new Accessor(
      () => activeCount.get() > 0,
      (callback) => (activeCount as any).subscribe?.(callback) ?? (() => {}),
    ) as StateAccessor<boolean> & { subscribe(callback: () => void): () => void }

    const refreshSnapshot = async () => {
      logShowCenterStage("displays refreshSnapshot enter")
      const queryDisplays = createPerfSpan("displays manager.query_async")
      const queried = (await manager.query_async(null) as any[])
        .map((display) => buildDisplayItem(display))
        .filter((item): item is DisplayBrightnessItem => item !== null)
      queryDisplays(`count=${queried.length}`)
      const activeKeys = new Set(queried.map((item) => item.key))

      setDisplayErrors((currentErrors) =>
        Object.fromEntries(Object.entries(currentErrors).filter(([key]) => activeKeys.has(key))),
      )

      return {
        items: queried,
        visible: queried.length > 0,
        tooltip: queried.length > 0 ? queried.map((item) => `${itemLabel(item)}: ${item.brightness}%`).join("\n") : "Displays unavailable",
      }
    }

    const createPoller = createPerfSpan("displays state poller setup")
    const poller = createAdaptivePollState<DisplaysSnapshot>(
      { items: [], visible: false, tooltip: "Displays unavailable" },
      {
        active,
        visibleIntervalMs: 3000,
        hiddenIntervalMs: null,
        poll: refreshSnapshot,
      },
    )
    createPoller()
    const snapshot = poller.value as SubscribableAccessor<DisplaysSnapshot>
    const attachedInstances = new Map<string, { refs: number; active: boolean; dispose: () => void }>()

    const updateActiveCount = () => {
      setActiveCount([...attachedInstances.values()].filter((entry) => entry.active).length)
    }

    logShowCenterStage("displays state factory ready")

    return {
      items: pickSnapshotField(snapshot, (value) => value.items),
      visible: pickSnapshotField(snapshot, (value) => value.visible),
      tooltip: pickSnapshotField(snapshot, (value) => value.tooltip),
      displayErrors,
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
      refresh: poller.refresh,
      applyBrightness: async (targetItems: DisplayBrightnessItem[], requestedBrightness: number, minimumBrightness: number) => {
        if (targetItems.length === 0) {
          return
        }

        const nextBrightness = clampBrightness(requestedBrightness, minimumBrightness)
        const updates = targetItems.map(
          (item) =>
            new AstalDisplays.DisplayUpdate({
              id: buildDisplayIdentifier(item),
              physical: new AstalDisplays.PhysicalDisplayUpdateContent({
                has_brightness: true,
                brightness: nextBrightness,
              }),
            }),
        )

        try {
          const updateDisplays = createPerfSpan("displays manager.update_async")
          const results = await manager.update_async(updates, null) as any[]
          updateDisplays(`count=${results.length}`)
          const nextErrors = { ...displayErrors.get() }
          const failedKeys = new Set<string>()

          results.forEach((result, index) => {
            const requestedItem = targetItems[index]
            const failedItems = listModelItems(getProperty<any>(result, "failed"))

            if (failedItems.length === 0) {
              if (requestedItem) {
                delete nextErrors[requestedItem.key]
              }
              return
            }

            let sawMappedFailure = false
            for (const failedItem of failedItems) {
              const matchedId = getProperty<any>(failedItem, "matchedId", "matched-id", "matched_id")
              const failureKey = buildDisplayKeyFromIdentifier(matchedId) || requestedItem?.key || null
              const message = getProperty<string>(failedItem, "message") || "Brightness update failed"

              if (!failureKey) {
                continue
              }

              nextErrors[failureKey] = message
              failedKeys.add(failureKey)
              sawMappedFailure = true
            }

            if (!sawMappedFailure && requestedItem) {
              nextErrors[requestedItem.key] = "Brightness update failed"
              failedKeys.add(requestedItem.key)
            }
          })

          for (const item of targetItems) {
            if (!failedKeys.has(item.key)) {
              delete nextErrors[item.key]
            }
          }

          setDisplayErrors(nextErrors)
        } catch (error) {
          console.error(error)
          const message = error instanceof Error ? error.message : "Brightness update failed"
          setDisplayErrors((currentErrors) => {
            const nextErrors = { ...currentErrors }
            for (const item of targetItems) {
              nextErrors[item.key] = message
            }
            return nextErrors
          })
        }

        void poller.refresh()
      },
    }
  })
}
