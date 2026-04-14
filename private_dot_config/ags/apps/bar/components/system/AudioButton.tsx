import Wp from "gi://AstalWp"

import { For } from "ags"
import { createBinding, createState, onCleanup } from "ags"
import { Gdk, Gtk } from "ags/gtk4"

import { run } from "../../utils/runtime"

import SystemMenuButton from "./SystemMenuButton"

type AudioButtonProps = {
  instanceId: string
}

/**
 * Uses Astal WirePlumber state for volume and endpoint selection.
 */
export default function AudioButton({ instanceId }: AudioButtonProps) {
  const wp = Wp.get_default()!
  const audio = wp.audio
  const speakers = createBinding(audio, "speakers")
  const microphones = createBinding(audio, "microphones")
  const [icon, setIcon] = createState("audio-volume-muted-symbolic")
  const [text, setText] = createState("--")
  const [tooltip, setTooltip] = createState("Audio unavailable")
  const [visible, setVisible] = createState(false)
  const popoverId = `audio-popover-${instanceId}`

  let trackedSpeaker: any = null
  const speakerSignalIds = new Array<number>()

  const disconnectSpeakerSignals = () => {
    if (!trackedSpeaker) {
      return
    }

    for (const id of speakerSignalIds.splice(0)) {
      trackedSpeaker.disconnect(id)
    }

    trackedSpeaker = null
  }

  const syncSpeakerState = () => {
    const speaker = audio.defaultSpeaker

    if (!speaker) {
      setVisible(false)
      setIcon("audio-volume-muted-symbolic")
      setText("--")
      setTooltip("Audio unavailable")
      return
    }

    const percent = Math.round(speaker.volume * 100)
    setVisible(true)
    setIcon(speaker.volumeIcon || "audio-volume-muted-symbolic")
    setText(`${percent}%`)
    setTooltip(`${speaker.description || "Speaker"}: ${speaker.mute ? "Muted" : `${percent}%`}`)
  }

  const trackSpeaker = () => {
    const speaker = audio.defaultSpeaker

    if (speaker === trackedSpeaker) {
      syncSpeakerState()
      return
    }

    disconnectSpeakerSignals()
    trackedSpeaker = speaker

    if (speaker) {
      for (const signal of ["notify::volume", "notify::mute", "notify::volume-icon", "notify::description"]) {
        speakerSignalIds.push(speaker.connect(signal, syncSpeakerState))
      }
    }

    syncSpeakerState()
  }

  const defaultSpeakerId = audio.connect("notify::default-speaker", trackSpeaker)
  const readyId = wp.connect("ready", trackSpeaker)
  trackSpeaker()

  onCleanup(() => {
    wp.disconnect(readyId)
    audio.disconnect(defaultSpeakerId)
    disconnectSpeakerSignals()
  })

  const changeVolume = (delta: number) => {
    const speaker = audio.defaultSpeaker
    if (!speaker) {
      return
    }

    const next = Math.max(0, Math.min(1.5, speaker.volume + delta))
    speaker.set_volume(next)
  }

  const toggleMute = () => {
    const speaker = audio.defaultSpeaker
    if (speaker) {
      speaker.set_mute(!speaker.mute)
    }
  }

  return (
    <box visible={visible}>
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
                <button class={createBinding(sink, "isDefault")((active) => (active ? "panel-button occupied" : "panel-button"))} onClicked={() => sink.set_is_default(true)}>
                  <label label={createBinding(sink, "description")} xalign={0} />
                </button>
              )}
            </For>
          </box>
          <label class="panel-section-title" label="Sources" xalign={0} />
          <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
            <For each={microphones}>
              {(source) => (
                <button class={createBinding(source, "isDefault")((active) => (active ? "panel-button occupied" : "panel-button"))} onClicked={() => source.set_is_default(true)}>
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
