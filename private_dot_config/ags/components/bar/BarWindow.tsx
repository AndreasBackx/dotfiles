import { Gdk, Gtk } from "ags/gtk4"

import { anchorForPosition, barPositionForRole, baseForRole } from "../../lib/bar-logic"
import { BAR_HEIGHT } from "../../lib/runtime"
import { attachHoverHandlers } from "../../lib/widget-helpers"
import type { BooleanAccessor, HyprStateAccessor, Role } from "../../lib/types"

import BarRoot from "./BarRoot"
import OverlayWindow from "./OverlayWindow"

type BarWindowProps = {
  gdkmonitor: Gdk.Monitor
  role: Role
  hyprState: HyprStateAccessor
  visible: BooleanAccessor
  onHoverEnter?: () => void
  onHoverLeave?: () => void
}

/**
 * Renders one full bar window for a monitor role.
 */
export default function BarWindow({
  gdkmonitor,
  role,
  hyprState,
  visible,
  onHoverEnter,
  onHoverLeave,
}: BarWindowProps) {
  const position = barPositionForRole(role)
  const geometry = gdkmonitor.get_geometry()
  const instanceId = `${role}-${gdkmonitor.connector}`
  const hoverId = `bar-window-${role}-${gdkmonitor.connector}`

  // Each role gets its own overlay window so monitors can independently host
  // left, center, right, or laptop bars without cross-monitor layout coupling.
  return (
    <OverlayWindow
      name={`bar-${role}-${gdkmonitor.connector}`}
      namespace={`ags-bar-${position}`}
      gdkmonitor={gdkmonitor}
      visible={visible}
      anchor={anchorForPosition(position)}
    >
      <box
        class={`bar-window-shell position-${position}`}
        widthRequest={geometry.width}
        heightRequest={BAR_HEIGHT}
        hexpand
        halign={Gtk.Align.FILL}
        $={(self) => attachHoverHandlers(self, hoverId, onHoverEnter, onHoverLeave)}
      >
        <BarRoot base={baseForRole(role)} hyprState={hyprState} instanceId={instanceId} position={position} />
      </box>
    </OverlayWindow>
  )
}
