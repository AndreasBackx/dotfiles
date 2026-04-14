import Pango from "gi://Pango?version=1.0"

import { sanitizedTitle } from "../../utils/parsers"
import type { HyprStateAccessor } from "../../utils/types"

type TitleSegmentProps = {
  hyprState: HyprStateAccessor
}

/**
 * Shows the focused window title with a safe desktop fallback.
 */
export default function TitleSegment({ hyprState }: TitleSegmentProps) {
  return (
    <label
      class="window-title"
      label={hyprState((state) => sanitizedTitle(state.windowTitle))}
      maxWidthChars={68}
      ellipsize={Pango.EllipsizeMode.END}
      xalign={0}
    />
  )
}
