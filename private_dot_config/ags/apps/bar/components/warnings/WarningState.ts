import GLib from "gi://GLib?version=2.0"

import { createState } from "ags"

import type { StateAccessor } from "../../../common/utils/state"
import { instanceActive } from "../../utils/activity"
import { getGlobalState } from "../../utils/global-state"
import { createAdaptivePollState } from "../../utils/polling"

type WarningSnapshot = {
  cpu: number
  memory: number
  memoryUsed: string
}

type WarningState = {
  cpu: StateAccessor<number>
  memory: StateAccessor<number>
  memoryUsed: StateAccessor<string>
  attachInstance: (instanceId: string) => () => void
}

type CpuSample = {
  idle: number
  total: number
}

type SubscribableAccessor<T> = StateAccessor<T> & {
  subscribe?: (callback: () => void) => () => void
}

function readText(path: string) {
  const [, bytes] = GLib.file_get_contents(path)
  return new TextDecoder().decode(bytes)
}

function parseCpuSample(): CpuSample | null {
  const line = readText("/proc/stat").split("\n")[0]
  const parts = line.trim().split(/\s+/)
  if (parts.length < 5 || parts[0] !== "cpu") {
    return null
  }

  const values = parts.slice(1).map((part) => Number.parseInt(part, 10)).filter((value) => Number.isFinite(value))
  const idle = (values[3] ?? 0) + (values[4] ?? 0)
  const total = values.reduce((sum, value) => sum + value, 0)
  return { idle, total }
}

function parseMemorySnapshot() {
  const entries = Object.fromEntries(
    readText("/proc/meminfo")
      .split("\n")
      .map((line) => line.match(/^(\w+):\s+(\d+)/))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map((match) => [match[1], Number.parseInt(match[2], 10)]),
  )

  const totalKb = entries.MemTotal ?? 0
  const availableKb = entries.MemAvailable ?? 0
  const usedKb = Math.max(0, totalKb - availableKb)
  const percent = totalKb > 0 ? Math.round((usedKb / totalKb) * 100) : 0
  const usedGiB = `${(usedKb / 1048576).toFixed(1)}GiB`

  return { percent, usedGiB }
}

/**
 * Returns the app-wide warning state shared by every `WarningItems` instance.
 *
 * CPU and memory pressure are global machine state, so they do not need one
 * polling loop per bar window. This singleton keeps a single adaptive poller
 * alive and only runs it while at least one bar instance is active.
 */
export function getWarningState(): WarningState {
  return getGlobalState("bar-warning-state", () => {
    const [activeCount, setActiveCount] = createState(0)
    const active = ((map?: (value: boolean) => boolean) => {
      const value = activeCount.get() > 0
      return typeof map === "function" ? map(value) : value
    }) as StateAccessor<boolean> & { subscribe(callback: () => void): () => void }
    active.get = () => activeCount.get() > 0
    active.subscribe = (callback: () => void) => (activeCount as any).subscribe?.(callback) ?? (() => {})

    let previousCpuSample = parseCpuSample()
    const poller = createAdaptivePollState<WarningSnapshot>(
      { cpu: 0, memory: 0, memoryUsed: "0.0GiB" },
      {
        active,
        visibleIntervalMs: 5000,
        hiddenIntervalMs: null,
        poll: () => {
          const nextCpuSample = parseCpuSample()
          const memory = parseMemorySnapshot()

          let cpu = 0
          if (previousCpuSample && nextCpuSample) {
            const idleDelta = nextCpuSample.idle - previousCpuSample.idle
            const totalDelta = nextCpuSample.total - previousCpuSample.total
            cpu = totalDelta > 0 ? Math.round(((totalDelta - idleDelta) / totalDelta) * 100) : 0
          }

          previousCpuSample = nextCpuSample

          return {
            cpu,
            memory: memory.percent,
            memoryUsed: memory.usedGiB,
          }
        },
      },
    )
    const snapshot = poller.value as SubscribableAccessor<WarningSnapshot>

    // Re-expose stable field accessors from the shared snapshot so the view can
    // bind directly to `cpu`, `memory`, and `memoryUsed` without knowing about
    // the composite polling payload.
    const pick = <T>(selector: (value: WarningSnapshot) => T) => {
      const accessor = ((map?: (value: T) => T) => {
        const selected = selector(snapshot.get())
        return typeof map === "function" ? map(selected) : selected
      }) as StateAccessor<T> & { subscribe?: (callback: () => void) => () => void }
      accessor.get = () => selector(snapshot.get())
      accessor.subscribe = (callback: () => void) => snapshot.subscribe?.(callback) ?? (() => {})
      return accessor
    }

    const attachedInstances = new Map<string, { refs: number; dispose: () => void; active: boolean }>()
    const updateActiveCount = () => {
      setActiveCount([...attachedInstances.values()].filter((entry) => entry.active).length)
    }

    return {
      cpu: pick((value) => value.cpu),
      memory: pick((value) => value.memory),
      memoryUsed: pick((value) => value.memoryUsed),
      attachInstance: (instanceId: string) => {
        const existing = attachedInstances.get(instanceId)
        if (existing) {
          existing.refs += 1
          return () => {
            existing.refs -= 1
          }
        }

        const activity = instanceActive(instanceId) as StateAccessor<boolean> & {
          subscribe?: (callback: () => void) => () => void
        }
        const entry = {
          refs: 1,
          active: activity.get(),
          dispose: activity.subscribe?.(() => {
            entry.active = activity.get()
            updateActiveCount()
          }) ?? (() => {}),
        }

        attachedInstances.set(instanceId, entry)
        updateActiveCount()

        return () => {
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
      },
    }
  })
}
