import { command, createTextPoll } from "../../lib/runtime"

export default function BatteryButton() {
  const icon = createTextPoll(15000, command("eww-battery", "icon"))
  const text = createTextPoll(15000, command("eww-battery", "text"))
  const tooltip = createTextPoll(15000, command("eww-battery", "tooltip"))
  const state = createTextPoll(15000, command("eww-battery", "state"))

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
