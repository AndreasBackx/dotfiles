import { Accessor } from "gnim"

import { createState } from "ags"
import { execAsync } from "ags/process"

import type { StateAccessor } from "../../../common/utils/state"
import { instanceActive } from "../../utils/activity"
import { getGlobalState } from "../../utils/global-state"
import { createAdaptivePollState } from "../../utils/polling"
import { command, parseJson, readCommandOutput, shell } from "../../utils/runtime"

type BackupSnapshot = {
  iconName: string
  tooltip: string
  class: string
  state: string
  visible: boolean
}

type BackupState = {
  iconName: StateAccessor<string>
  tooltip: StateAccessor<string>
  state: StateAccessor<string>
  visible: StateAccessor<boolean>
  initBackup: () => Promise<void>
  startNow: () => Promise<void>
  stop: () => Promise<void>
  openLogs: () => Promise<void>
  attachInstance: (instanceId: string) => () => void
}

const FALLBACK_SNAPSHOT: BackupSnapshot = {
  iconName: "drive-harddisk-symbolic",
  tooltip: "Backup state unavailable.",
  class: "disabled",
  state: "disabled",
  visible: false,
}

function iconForState(state: string, fallback: string) {
  switch (state) {
    case "running":
      return "view-refresh-symbolic"
    case "waiting":
      return "document-save-symbolic"
    case "ok":
      return "drive-harddisk-symbolic"
    case "stale":
      return "alarm-symbolic"
    case "failed":
      return "dialog-error-symbolic"
    case "uninitialized":
      return "system-software-install-symbolic"
    case "disabled":
      return "changes-prevent-symbolic"
    default:
      return fallback || FALLBACK_SNAPSHOT.iconName
  }
}

async function readBackupSnapshot() {
  return parseJson<BackupSnapshot>(readCommandOutput(command("backup", "status"), JSON.stringify(FALLBACK_SNAPSHOT)), FALLBACK_SNAPSHOT)
}

/**
 * Returns the shared backup state for all bar instances.
 *
 * Backup status is global machine state, so one adaptive poller is enough for
 * every visible bar. Actions also refresh the shared snapshot after they
 * complete so the UI catches up quickly without each instance polling on its
 * own.
 */
export function getBackupState(): BackupState {
  return getGlobalState("bar-backup-state", () => {
    const [activeCount, setActiveCount] = createState(0)
    const active = new Accessor(
      () => activeCount.get() > 0,
      (callback) => (activeCount as any).subscribe?.(callback) ?? (() => {}),
    ) as StateAccessor<boolean> & { subscribe(callback: () => void): () => void }

    const poller = createAdaptivePollState<BackupSnapshot>(FALLBACK_SNAPSHOT, {
      active,
      visibleIntervalMs: 5000,
      hiddenIntervalMs: 30000,
      poll: readBackupSnapshot,
    })
    const snapshot = poller.value as StateAccessor<BackupSnapshot> & {
      subscribe?: (callback: () => void) => () => void
    }

    const pick = <T>(selector: (value: BackupSnapshot) => T) => {
      return new Accessor(() => selector(snapshot.get()), (callback) => snapshot.subscribe?.(callback) ?? (() => {})) as StateAccessor<T>
    }

    const attachedInstances = new Map<string, { refs: number; active: boolean; dispose: () => void }>()
    const updateActiveCount = () => {
      setActiveCount([...attachedInstances.values()].filter((entry) => entry.active).length)
    }

    const runTerminalCommand = async (cmd: string, refresh = false) => {
      try {
        await execAsync(
          shell(
            `if command -v ghostty >/dev/null 2>&1; then exec ghostty -e sh -lc '${cmd}'; fi; if command -v kitty >/dev/null 2>&1; then exec kitty sh -lc '${cmd}'; fi; exit 127`,
          ),
        )
      } catch (error) {
        console.error(error)
      } finally {
        if (refresh) {
          await poller.refresh()
        }
      }
    }

    return {
      iconName: pick((value) => iconForState(value.state, value.iconName)),
      tooltip: pick((value) => value.tooltip || FALLBACK_SNAPSHOT.tooltip),
      state: pick((value) => value.state || FALLBACK_SNAPSHOT.state),
      visible: pick((value) => value.visible),
      initBackup: () => runTerminalCommand("backup init", true),
      startNow: () => runTerminalCommand("backup start --background", true),
      stop: () => runTerminalCommand("backup stop", true),
      openLogs: async () => {
        try {
          await execAsync(shell("if command -v ghostty >/dev/null 2>&1; then exec ghostty -e journalctl -u backup.service -f --no-hostname; fi; if command -v kitty >/dev/null 2>&1; then exec kitty sh -lc 'journalctl -u backup.service -f --no-hostname'; fi"))
        } catch (error) {
          console.error(error)
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
