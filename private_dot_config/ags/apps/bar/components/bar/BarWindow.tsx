import { onCleanup } from "ags"
import { Gdk, Gtk } from "ags/gtk4"

import { anchorForPosition, barPositionForRole, baseForRole } from "../../utils/bar-logic"
import { removeInstance, setInstanceVisible } from "../../utils/activity"
import { BAR_HEIGHT } from "../../utils/runtime"
import { attachHoverHandlers } from "../../utils/widget-helpers"
import type { BooleanAccessor, HyprStateAccessor, Role } from "../../utils/types"

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

  // Report this window's mapped visibility into the shared activity registry so
  // child widgets can later pause or slow their background work while the bar
  // is hidden, then refresh immediately when it becomes active again.
  const syncVisibility = () => {
    setInstanceVisible(instanceId, visible())
  }
  const unsubscribeVisibility = (visible as any).subscribe?.(syncVisibility) ?? null

  syncVisibility()

  onCleanup(() => {
    unsubscribeVisibility?.()
    removeInstance(instanceId)
  })

  // Each role gets its own overlay window so monitors can independently host
  // left, center, right, or laptop bars without cross-monitor layout coupling.
  return (
    <OverlayWindow
      name={`bar-${role}-${gdkmonitor.connector}`}
      namespace={`ags-bar-${gdkmonitor.connector}`}
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
