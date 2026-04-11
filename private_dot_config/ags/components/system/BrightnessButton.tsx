import { Gtk } from "ags/gtk4"

import { command, createTextPoll, run } from "../../lib/runtime"

import SystemMenuButton from "./SystemMenuButton"

type BrightnessButtonProps = {
  instanceId: string
}

export default function BrightnessButton({ instanceId }: BrightnessButtonProps) {
  const text = createTextPoll(3000, command("eww-brightness", "text"))
  const tooltip = createTextPoll(3000, command("eww-brightness", "tooltip"))
  const popoverId = `brightness-popover-${instanceId}`
  const presets = [0, 25, 50, 75, 100]

  return (
    <SystemMenuButton
      popoverId={popoverId}
      tooltipText={tooltip}
      button={
        <box class="bar-item with-text">
          <label class="item-icon" label="󰃠" />
          <label class="item-text" label={text} />
        </box>
      }
    >
        <box class="panel" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
          <label class="panel-title" label="Brightness" xalign={0} />
          <box class="panel-row" spacing={8}>
            <button onClicked={() => run(command("eww-brightness", "down"))}>-10%</button>
            <button onClicked={() => run(command("eww-brightness", "up"))}>+10%</button>
          </box>
          <box class="panel-row" spacing={8}>
            {presets.map((value) => (
              <button onClicked={() => run(command("eww-brightness", "set", `${value}`))}>
                <label label={`${value}`} />
              </button>
            ))}
          </box>
        </box>
    </SystemMenuButton>
  )
}
