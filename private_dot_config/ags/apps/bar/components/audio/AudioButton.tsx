import { For } from "ags"
import { createBinding } from "ags"
import { Gdk, Gtk } from "ags/gtk4"

import { run } from "../../utils/runtime"
import { getAudioState } from "./AudioState"

import SystemMenuButton from "../system/SystemMenuButton"

type AudioButtonProps = {
  instanceId: string
}

/**
 * Uses Astal WirePlumber state for volume and endpoint selection.
 */
export default function AudioButton({ instanceId }: AudioButtonProps) {
  const { speakers, microphones, icon, text, tooltip, visible, changeVolume, toggleMute } = getAudioState()
  const popoverId = `audio-popover-${instanceId}`

  return (
    <box visible={visible}>
      <SystemMenuButton
        popoverId={popoverId}
        instanceId={instanceId}
        tooltipText={tooltip}
        button={
          <box
            class="bar-item with-text"
            halign={Gtk.Align.CENTER}
            $={(self: Gtk.Box) => {
              const controller = new Gtk.GestureClick()
              controller.set_button(Gdk.BUTTON_SECONDARY)
              controller.connect("pressed", () => run(["pavucontrol"]))
              self.add_controller(controller)
            }}
          >
            <box class="system-button-content with-text" halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER}>
              <image iconName={icon} pixelSize={16} />
              <label class="item-text" label={text} />
            </box>
          </box>
        }
      >
        <box class="panel" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
          <label class="panel-title" label="PipeWire" xalign={0} />
          <label class="panel-status" label={tooltip} xalign={0} />
          <box class="panel-row" spacing={8}>
            <button onClicked={() => changeVolume(-0.05)}>-5%</button>
            <button onClicked={() => changeVolume(0.05)}>+5%</button>
            <button onClicked={toggleMute}>Mute</button>
            <button onClicked={() => run(["pavucontrol"])}>Pavucontrol</button>
          </box>
          <label class="panel-section-title" label="Sinks" xalign={0} />
          <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
            <For each={speakers}>
              {(sink) => (
                <button
                  class={createBinding(sink, "isDefault")((active) => (active ? "panel-button occupied" : "panel-button"))}
                  onClicked={() => sink.set_is_default(true)}
                >
                  <label label={createBinding(sink, "description")} xalign={0} />
                </button>
              )}
            </For>
          </box>
          <label class="panel-section-title" label="Sources" xalign={0} />
          <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
            <For each={microphones}>
              {(source) => (
                <button
                  class={createBinding(source, "isDefault")((active) => (active ? "panel-button occupied" : "panel-button"))}
                  onClicked={() => source.set_is_default(true)}
                >
                  <label label={createBinding(source, "description")} xalign={0} />
                </button>
              )}
            </For>
          </box>
        </box>
      </SystemMenuButton>
    </box>
  )
}
