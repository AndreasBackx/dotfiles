import { Gdk, Gtk } from "ags/gtk4"

import { baseForRole, barPositionForRole, workspaceStripAnchorForPosition } from "../../utils/bar-logic"
import { attachHoverHandlers } from "../../utils/widget-helpers"
import type { BooleanAccessor, HyprStateAccessor, Role } from "../../utils/types"

import OverlayWindow from "./OverlayWindow"
import WorkspaceStrip from "../workspaces/WorkspaceStrip"

type WorkspaceRevealWindowProps = {
  gdkmonitor: Gdk.Monitor
  role: Role
  hyprState: HyprStateAccessor
  visible: BooleanAccessor
  onHover: () => void
}

/**
 * Renders the thin workspace-only reveal strip used while the center bar is
 * auto-hidden.
 */
export default function WorkspaceRevealWindow({
  gdkmonitor,
  role,
  hyprState,
  visible,
  onHover,
}: WorkspaceRevealWindowProps) {
  const position = barPositionForRole(role)
  const geometry = gdkmonitor.get_geometry()
  const hoverId = `workspace-reveal-${role}-${gdkmonitor.connector}`

  // This window only appears while the auto-hidden center bar is collapsed.
  return (
    <OverlayWindow
      name={`bar-workspaces-${role}-${gdkmonitor.connector}`}
      namespace={`ags-workspaces-${position}`}
      gdkmonitor={gdkmonitor}
      visible={visible}
      anchor={workspaceStripAnchorForPosition(position)}
      marginTop={position === "top" ? 0 : undefined}
      marginBottom={position === "bottom" ? 0 : undefined}
    >
      <box
        class={`workspace-reveal-shell position-${position}`}
        widthRequest={geometry.width}
        hexpand
        halign={Gtk.Align.FILL}
        $={(self) => attachHoverHandlers(self, hoverId, onHover)}
      >
        <WorkspaceStrip base={baseForRole(role)} hyprState={hyprState} />
      </box>
    </OverlayWindow>
  )
}
