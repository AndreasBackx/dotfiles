import Pango from "gi://Pango?version=1.0"

import { sanitizedTitle } from "../../lib/parsers"
import type { HyprStateAccessor } from "../../lib/types"

type TitleSegmentProps = {
  hyprState: HyprStateAccessor
}

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
