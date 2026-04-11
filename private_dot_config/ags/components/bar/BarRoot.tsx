import { Gtk } from "ags/gtk4"

import SpotifySegment from "../spotify/SpotifySegment"
import SystemSegment from "../system/SystemSegment"
import TitleSegment from "../title/TitleSegment"
import WorkspaceStrip from "../workspaces/WorkspaceStrip"
import type { HyprStateAccessor } from "../../lib/types"

type BarRootProps = {
  base: number
  hyprState: HyprStateAccessor
  instanceId: string
  position: "top" | "bottom"
}

/**
 * Lays out the left, center, and right content segments inside a bar window.
 */
export default function BarRoot({ base, hyprState, instanceId, position }: BarRootProps) {
  return (
    <centerbox
      class={`bar-root position-${position}`}
      orientation={Gtk.Orientation.HORIZONTAL}
      hexpand
      halign={Gtk.Align.FILL}
    >
      <box $type="start" class="left-side" spacing={6} hexpand>
        <WorkspaceStrip base={base} hyprState={hyprState} />
        <TitleSegment hyprState={hyprState} />
      </box>
      <box $type="center" class="center-side" hexpand halign={Gtk.Align.CENTER}>
        <SpotifySegment />
      </box>
      <box $type="end" class="right-side" hexpand halign={Gtk.Align.END}>
        <SystemSegment instanceId={instanceId} />
      </box>
    </centerbox>
  )
}
