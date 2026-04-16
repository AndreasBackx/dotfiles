import { onCleanup } from "ags"

import { getWarningState } from "./WarningState"

type WarningItemsProps = {
  instanceId: string
}

/**
 * Shows CPU and memory warning badges only when they cross the configured
 * thresholds.
 *
 * The underlying polling state is shared app-wide and only runs while at least
 * one bar instance is active. This component itself is now just a light view
 * over that shared state.
 */
export default function WarningItems({ instanceId }: WarningItemsProps) {
  const { cpu, memory, memoryUsed, attachInstance } = getWarningState()
  const detach = attachInstance(instanceId)

  onCleanup(() => {
    detach()
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
