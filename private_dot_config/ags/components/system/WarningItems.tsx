import { createPoll } from "ags/time"
import { execAsync } from "ags/process"

import { shell } from "../../lib/runtime"

const CPU_USAGE_COMMAND =
  "top -bn1 | awk '/%Cpu|Cpu\\(s\\)/ {for (i = 1; i <= NF; i++) if ($i ~ /id,?/) {print int(100 - $(i - 1)); exit}}'"
const MEMORY_PERCENT_COMMAND = "free | awk '/Mem:/ {print int(($3 / $2) * 100)}'"
const MEMORY_USED_COMMAND = `free -b | awk '/Mem:/ {printf "%.1fGiB", $3 / 1073741824}'`

export default function WarningItems() {
  const cpu = createPoll(0, 5000, async () => {
    const stdout = await execAsync(shell(CPU_USAGE_COMMAND))
    return Number.parseInt(stdout.trim() || "0", 10)
  })
  const memory = createPoll(0, 5000, async () => {
    const stdout = await execAsync(shell(MEMORY_PERCENT_COMMAND))
    return Number.parseInt(stdout.trim() || "0", 10)
  })
  const memoryUsed = createPoll("", 5000, async () => {
    const stdout = await execAsync(shell(MEMORY_USED_COMMAND))
    return stdout.trim()
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
