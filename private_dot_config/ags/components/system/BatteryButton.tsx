import { createCommandTextPolls } from "../../lib/runtime"

/**
 * Shows the current battery icon and percentage when a battery is present.
 */
export default function BatteryButton() {
  const { icon, text, tooltip, state } = createCommandTextPolls(
    15000,
    "eww-battery",
    ["icon", "text", "tooltip", "state"] as const,
  )

  return (
    <box visible={text((value) => value.length > 0)}>
      <button class={state((value) => `bar-item with-text battery-${value}`)} tooltipText={tooltip}>
        <box>
          <label class="item-icon" label={icon} />
          <label class="item-text" label={text} />
        </box>
      </button>
    </box>
  )
}
