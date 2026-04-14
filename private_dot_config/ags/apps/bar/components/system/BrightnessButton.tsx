import { Gtk } from "ags/gtk4"

import { command, createTextPoll, run } from "../../utils/runtime"

import SystemMenuButton from "./SystemMenuButton"

type BrightnessButtonProps = {
  instanceId: string
}

/**
 * Shows brightness and exposes quick adjustment presets in a popover.
 */
export default function BrightnessButton({ instanceId }: BrightnessButtonProps) {
  const backend = instanceId.startsWith("laptop-") ? "brightnessctl" : "minos"
  console.log(`[ags][brightness] ${instanceId} using ${backend}`)
  const text = createTextPoll(3000, command("bar-brightness", backend, "text"))
  const tooltip = createTextPoll(3000, command("bar-brightness", backend, "tooltip"))
  const popoverId = `brightness-popover-${instanceId}`
  const presets = [0, 25, 50, 75, 100]

  return (
    <SystemMenuButton
      popoverId={popoverId}
      tooltipText={tooltip}
      button={
        <box class="bar-item with-text" halign={Gtk.Align.CENTER}>
          <box class="system-button-content with-text" halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER}>
            <label class="item-icon" label="󰃠" xalign={0.5} yalign={0.5} widthRequest={16} />
            <label class="item-text" label={text} />
          </box>
        </box>
      }
    >
        <box class="panel" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
          <label class="panel-title" label="Brightness" xalign={0} />
          <box class="panel-row" spacing={8}>
            <button onClicked={() => run(command("bar-brightness", backend, "down"))}>-10%</button>
            <button onClicked={() => run(command("bar-brightness", backend, "up"))}>+10%</button>
          </box>
          <box class="panel-row" spacing={8}>
            {presets.map((value) => (
              <button onClicked={() => run(command("bar-brightness", backend, "set", `${value}`))}>
                <label label={`${value}`} />
              </button>
            ))}
          </box>
        </box>
    </SystemMenuButton>
  )
}
