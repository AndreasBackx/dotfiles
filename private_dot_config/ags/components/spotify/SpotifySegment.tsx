import Pango from "gi://Pango?version=1.0"

import { createSubprocess } from "ags/process"

import { command, run, trimOutput } from "../../lib/runtime"

/**
 * Streams Spotify metadata into the center segment and toggles playback on
 * click.
 */
export default function SpotifySegment() {
  // The helper scripts expose long-lived streams, so subprocess bindings are a
  // better fit than polling here.
  const text = createSubprocess("", command("eww-spotify", "monitor"), trimOutput)
  const tooltip = createSubprocess("", command("eww-spotify", "monitor-tooltip"), trimOutput)
  const state = createSubprocess("paused", command("eww-spotify", "monitor-state"), trimOutput)

  return (
    <button
      class={state((value) => `spotify-button spotify-${value}`)}
      visible={text((value) => value.length > 0)}
      tooltipText={tooltip}
      onClicked={() => run(["playerctl", "play-pause"])}
    >
      <label
        class={state((value) => `spotify-text spotify-${value}`)}
        label={text}
        maxWidthChars={54}
        ellipsize={Pango.EllipsizeMode.END}
      />
    </button>
  )
}
