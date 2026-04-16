import Wp from "gi://AstalWp"

import { createBinding, createState } from "ags"

import type { StateAccessor } from "../../../common/utils/state"
import { getGlobalState } from "../../utils/global-state"

type AudioStateValue = {
  speakers: any
  microphones: any
  icon: StateAccessor<string>
  text: StateAccessor<string>
  tooltip: StateAccessor<string>
  visible: StateAccessor<boolean>
  changeVolume: (delta: number) => void
  toggleMute: () => void
}

/**
 * Returns the shared WirePlumber-backed audio state for all bar instances.
 */
export function getAudioState(): AudioStateValue {
  return getGlobalState("bar-audio-state", () => {
    const wp = Wp.get_default()!
    const audio = wp.audio
    const speakers = createBinding(audio, "speakers")
    const microphones = createBinding(audio, "microphones")
    const [icon, setIcon] = createState("audio-volume-muted-symbolic")
    const [text, setText] = createState("--")
    const [tooltip, setTooltip] = createState("Audio unavailable")
    const [visible, setVisible] = createState(false)

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

    audio.connect("notify::default-speaker", trackSpeaker)
    wp.connect("ready", trackSpeaker)
    trackSpeaker()

    return {
      speakers,
      microphones,
      icon,
      text,
      tooltip,
      visible,
      changeVolume: (delta: number) => {
        const speaker = audio.defaultSpeaker
        if (!speaker) {
          return
        }

        const next = Math.max(0, Math.min(1.5, speaker.volume + delta))
        speaker.set_volume(next)
      },
      toggleMute: () => {
        const speaker = audio.defaultSpeaker
        if (speaker) {
          speaker.set_mute(!speaker.mute)
        }
      },
    }
  })
}
