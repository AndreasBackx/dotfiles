import { Gtk } from "ags/gtk4"

import { createCommandTextPolls } from "../../lib/runtime"

/**
 * Shows the current battery icon and percentage when a battery is present.
 */
export default function BatteryButton() {
  const { icon, text, tooltip, state } = createCommandTextPolls(
    15000,
    "bar-battery",
    ["icon", "text", "tooltip", "state"] as const,
  )

  return (
    <box visible={text((value) => value.length > 0)}>
      <button class={state((value) => `bar-item with-text battery-${value}`)} tooltipText={tooltip}>
        <box class="system-button-content with-text" halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER}>
          <label class="item-icon" label={icon} xalign={0.5} yalign={0.5} widthRequest={16} />
          <label class="item-text" label={text} />
        </box>
      </button>
    </box>
  )
}
