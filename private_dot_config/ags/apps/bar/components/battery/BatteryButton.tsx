import { Gtk } from "ags/gtk4"

import { getBatteryState } from "./BatteryState"

/**
 * Shows the current battery icon and percentage when a battery is present.
 */
export default function BatteryButton() {
  const { iconName, visible, text, tooltip, state } = getBatteryState()

  return (
    <box visible={visible}>
      <button class={state((value) => `bar-item with-text battery-${value}`)} tooltipText={tooltip}>
        <box class="system-button-content with-text" halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER}>
          <image iconName={iconName} pixelSize={16} />
          <label class="item-text" label={text} />
        </box>
      </button>
    </box>
  )
}
