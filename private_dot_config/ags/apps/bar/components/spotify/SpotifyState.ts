import { createSubprocess } from "ags/process"

import type { StateAccessor } from "../../../common/utils/state"
import { getGlobalState } from "../../utils/global-state"
import { command, trimOutput } from "../../utils/runtime"

type SpotifyState = {
  text: StateAccessor<string>
  tooltip: StateAccessor<string>
  state: StateAccessor<string>
}

/**
 * Returns the app-wide Spotify monitor state shared by every `SpotifySegment`.
 *
 * The helper scripts behind the Spotify widget are long-lived monitor
 * subprocesses. Without this singleton, every visible bar window would spawn a
 * duplicate set of monitor processes for the same global playback state.
 *
 * Keeping the subprocesses here means each bar instance only renders shared
 * accessors while a single monitor pipeline feeds the whole app.
 */
export function getSpotifyState(): SpotifyState {
  return getGlobalState("bar-spotify-state", () => ({
    text: createSubprocess("", command("bar-spotify", "monitor"), trimOutput),
    tooltip: createSubprocess("", command("bar-spotify", "monitor-tooltip"), trimOutput),
    state: createSubprocess("paused", command("bar-spotify", "monitor-state"), trimOutput),
  }))
}
