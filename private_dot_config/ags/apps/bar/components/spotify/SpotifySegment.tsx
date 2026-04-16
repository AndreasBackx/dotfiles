import Pango from "gi://Pango?version=1.0"

import { Gdk, Gtk } from "ags/gtk4"

import { command, run } from "../../utils/runtime"
import { getSpotifyState } from "./SpotifyState"

/**
 * Streams Spotify metadata into the center segment and toggles playback on
 * click.
 *
 * The subprocess-backed monitor state is shared app-wide through
 * `getSpotifyState()`. That keeps multi-monitor setups from spawning duplicate
 * long-lived helper processes for every visible bar instance.
 */
export default function SpotifySegment() {
  const { text, tooltip, state } = getSpotifyState()

  return (
    <button
      class={state((value) => `spotify-button spotify-${value}`)}
      visible={text((value) => value.length > 0)}
      tooltipText={tooltip}
      onClicked={() => run(["playerctl", "play-pause"])}
      $={(self: Gtk.Button) => {
        const controller = new Gtk.GestureClick()
        controller.set_button(Gdk.BUTTON_SECONDARY)
        controller.connect("pressed", () => run(command("bar-spotify", "toggle-liked")))
        self.add_controller(controller)
      }}
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
