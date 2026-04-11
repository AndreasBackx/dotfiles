import { For } from "ags"
import { Gtk } from "ags/gtk4"
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
  const { icon, text, tooltip } = createCommandTextPolls(2000, "eww-audio", ["icon", "text", "tooltip"] as const)
  const pipewire = createPoll({ sinks: new Array<AudioEndpoint>(), sources: new Array<AudioEndpoint>() }, 5000, async () => {
    const stdout = await execAsync(shell("wpctl status"))
    return {
      sinks: parseWpSection(stdout, "Sinks"),
      sources: parseWpSection(stdout, "Sources"),
    }
  })
  const popoverId = `audio-popover-${instanceId}`

  return (
    <SystemMenuButton
      popoverId={popoverId}
      tooltipText={tooltip}
      button={
        <box class="bar-item with-text">
          <label class="item-icon" label={icon} />
          <label class="item-text" label={text} />
        </box>
      }
    >
        <box class="panel" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
          <label class="panel-title" label="PipeWire" xalign={0} />
          <label class="panel-status" label={tooltip} xalign={0} />
          <box class="panel-row" spacing={8}>
            <button onClicked={() => run(command("eww-audio", "down"))}>-5%</button>
            <button onClicked={() => run(command("eww-audio", "up"))}>+5%</button>
            <button onClicked={() => run(command("eww-audio", "toggle-mute"))}>mute</button>
            <button onClicked={() => run(["pavucontrol"])}>pavucontrol</button>
          </box>
          <label class="panel-section-title" label="Sinks" xalign={0} />
          <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
            <For each={pipewire((state) => state.sinks)}>
              {(sink) => (
                <button
                  class={sink.active ? "panel-button occupied" : "panel-button"}
                  onClicked={() => run(command("eww-audio", "set-sink", sink.id))}
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
                  onClicked={() => run(command("eww-audio", "set-source", source.id))}
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
