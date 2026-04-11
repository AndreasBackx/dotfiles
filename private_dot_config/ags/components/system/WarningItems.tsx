import { createPoll } from "ags/time"
import { execAsync } from "ags/process"

import { shell } from "../../lib/runtime"

const CPU_USAGE_COMMAND =
  "top -bn1 | awk '/%Cpu|Cpu\\(s\\)/ {for (i = 1; i <= NF; i++) if ($i ~ /id,?/) {print int(100 - $(i - 1)); exit}}'"
const MEMORY_PERCENT_COMMAND = "free | awk '/Mem:/ {print int(($3 / $2) * 100)}'"
const MEMORY_USED_COMMAND = `free -b | awk '/Mem:/ {printf "%.1fGiB", $3 / 1073741824}'`

/** Parses a percentage-like stdout value while treating invalid output as zero. */
function parsePercentOrZero(stdout: string) {
  const parsed = Number.parseInt(stdout.trim(), 10)
  return Number.isNaN(parsed) ? 0 : parsed
}

/** Trims shell output before it is displayed in a label. */
function parseTrimmed(stdout: string) {
  return stdout.trim()
}

/**
 * Shows CPU and memory warning badges only when they cross the configured
 * thresholds.
 */
export default function WarningItems() {
  const cpu = createPoll(0, 5000, async () => {
    const stdout = await execAsync(shell(CPU_USAGE_COMMAND))
    return parsePercentOrZero(stdout)
  })
  const memory = createPoll(0, 5000, async () => {
    const stdout = await execAsync(shell(MEMORY_PERCENT_COMMAND))
    return parsePercentOrZero(stdout)
  })
  const memoryUsed = createPoll("", 5000, async () => {
    const stdout = await execAsync(shell(MEMORY_USED_COMMAND))
    return parseTrimmed(stdout)
  })

  return (
    <box spacing={1}>
      <box visible={cpu((value) => value >= 90)}>
        <button class="bar-item with-text" tooltipText={cpu((value) => `CPU: ${value}%`)}>
          <label label={cpu((value) => ` ${value}%`)} />
        </button>
      </box>
      <box visible={memory((value) => value >= 90)}>
        <button class="bar-item with-text" tooltipText={memory((value) => `Memory: ${value}%`)}>
          <label label={memoryUsed((value) => ` ${value}`)} />
        </button>
      </box>
    </box>
  )
}
