import { For } from "ags"
import { Gdk, Gtk } from "ags/gtk4"
import { createPoll } from "ags/time"
import { execAsync } from "ags/process"

import { parseWpSection } from "../../lib/parsers"
import { command, createCommandTextPolls, run, shell } from "../../lib/runtime"
import type { AudioEndpoint } from "../../lib/types"

import SystemMenuButton from "./SystemMenuButton"

type AudioButtonProps = {
  instanceId: string
}

/**
 * Polls PipeWire status and offers sink/source selection in a popover.
 */
export default function AudioButton({ instanceId }: AudioButtonProps) {
  const { icon, text, tooltip } = createCommandTextPolls(2000, "bar-audio", ["icon", "text", "tooltip"] as const)
  const pipewire = createPoll({ sinks: new Array<AudioEndpoint>(), sources: new Array<AudioEndpoint>() }, 5000, async () => {
    const stdout = await execAsync(shell("wpctl status"))
    const endpoints = {
      sinks: parseWpSection(stdout, "Sinks"),
      sources: parseWpSection(stdout, "Sources"),
    }
    console.log(
      `[ags][audio] ${instanceId} polled ${endpoints.sinks.length} sinks and ${endpoints.sources.length} sources`,
    )
    return endpoints
  })
  const popoverId = `audio-popover-${instanceId}`

  return (
    <SystemMenuButton
      popoverId={popoverId}
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
            <label class="item-icon" label={icon} xalign={0.5} yalign={0.5} widthRequest={16} />
            <label class="item-text" label={text} />
          </box>
        </box>
      }
    >
        <box class="panel" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
          <label class="panel-title" label="PipeWire" xalign={0} />
          <label class="panel-status" label={tooltip} xalign={0} />
          <box class="panel-row" spacing={8}>
            <button onClicked={() => run(command("bar-audio", "down"))}>-5%</button>
            <button onClicked={() => run(command("bar-audio", "up"))}>+5%</button>
            <button onClicked={() => run(command("bar-audio", "toggle-mute"))}>Mute</button>
            <button onClicked={() => run(["pavucontrol"])}>Pavucontrol</button>
          </box>
          <label class="panel-section-title" label="Sinks" xalign={0} />
          <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
            <For each={pipewire((state) => state.sinks)}>
              {(sink) => (
                <button
                  class={sink.active ? "panel-button occupied" : "panel-button"}
                  onClicked={() => run(command("bar-audio", "set-sink", sink.id))}
                >
                  <label label={sink.name} xalign={0} />
                </button>
              )}
            </For>
          </box>
          <label class="panel-section-title" label="Sources" xalign={0} />
          <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
            <For each={pipewire((state) => state.sources)}>
              {(source) => (
                <button
                  class={source.active ? "panel-button occupied" : "panel-button"}
                  onClicked={() => run(command("bar-audio", "set-source", source.id))}
                >
                  <label label={source.name} xalign={0} />
                </button>
              )}
            </For>
          </box>
        </box>
    </SystemMenuButton>
  )
}
