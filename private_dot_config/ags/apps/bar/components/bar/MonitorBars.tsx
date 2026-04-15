import { Gdk } from "ags/gtk4"

import { centerAutoHideEnabled, centerTargetRole, connectorForRole, soloLaptopCenter } from "../../utils/bar-logic"
import type { BooleanAccessor, HyprState, HyprStateAccessor, Role, RoleAccessor } from "../../utils/types"

import BarWindow from "./BarWindow"
import WorkspaceRevealWindow from "./WorkspaceRevealWindow"

type MonitorBarsProps = {
  gdkmonitor: Gdk.Monitor
  hyprState: HyprStateAccessor
  enabledRoles: RoleAccessor
  centerVisible: BooleanAccessor
  workspaceStripVisible: BooleanAccessor
  showCenter: () => void
  hideCenter: () => void
}

function roleEnabled(enabledRoles: Role[], role: Role) {
  return enabledRoles.includes(role)
}

function shouldRenderRole(state: HyprState, enabledRoles: Role[], role: Role, connector: string) {
  if (!roleEnabled(enabledRoles, role) || !roleIsOnCurrentMonitor(state, role, connector)) {
    return false
  }

  if (role === "left" || role === "right") {
    return !soloLaptopCenter(state)
  }

  return true
}

/** Returns whether a role currently belongs to the monitor being rendered. */
function roleIsOnCurrentMonitor(state: HyprState, role: Role, connector: string) {
  return connectorForRole(state, role) === connector
}

/** Returns visibility for the main center/laptop bar window on one monitor. */
function primaryVisibleForRole(
  state: HyprState,
  role: "center" | "laptop",
  connector: string,
  centerVisible: boolean,
) {
  return (
    centerTargetRole(state) === role &&
    roleIsOnCurrentMonitor(state, role, connector) &&
    (!centerAutoHideEnabled(state) || centerVisible)
  )
}

/** Returns visibility for the reveal-only workspace strip on one monitor. */
function revealVisibleForRole(
  state: HyprState,
  role: "center" | "laptop",
  connector: string,
  centerVisible: boolean,
  workspaceStripVisible: boolean,
) {
  return (
    centerTargetRole(state) === role &&
    roleIsOnCurrentMonitor(state, role, connector) &&
    centerAutoHideEnabled(state) &&
    !centerVisible &&
    workspaceStripVisible
  )
}

/**
 * Creates all bar windows needed for one physical monitor.
 */
export default function MonitorBars({
  gdkmonitor,
  hyprState,
  enabledRoles,
  centerVisible,
  workspaceStripVisible,
  showCenter,
  hideCenter,
}: MonitorBarsProps) {
  const connector = gdkmonitor.connector

  const leftVisible = hyprState((state) => !soloLaptopCenter(state) && roleIsOnCurrentMonitor(state, "left", connector))
  const rightVisible = hyprState(
    (state) => !soloLaptopCenter(state) && roleIsOnCurrentMonitor(state, "right", connector),
  )
  const centerVisibleOnMonitor = hyprState((state) => primaryVisibleForRole(state, "center", connector, centerVisible()))
  const laptopVisibleOnMonitor = hyprState((state) => primaryVisibleForRole(state, "laptop", connector, centerVisible()))
  const centerRevealVisible = hyprState((state) =>
    revealVisibleForRole(state, "center", connector, centerVisible(), workspaceStripVisible()),
  )
  const laptopRevealVisible = hyprState((state) =>
    revealVisibleForRole(state, "laptop", connector, centerVisible(), workspaceStripVisible()),
  )

  return (
    <>
      {shouldRenderRole(hyprState(), enabledRoles(), "left", connector) && (
        <BarWindow gdkmonitor={gdkmonitor} role="left" hyprState={hyprState} visible={leftVisible} />
      )}
      {shouldRenderRole(hyprState(), enabledRoles(), "right", connector) && (
        <BarWindow gdkmonitor={gdkmonitor} role="right" hyprState={hyprState} visible={rightVisible} />
      )}
      {shouldRenderRole(hyprState(), enabledRoles(), "center", connector) && (
        <BarWindow
          gdkmonitor={gdkmonitor}
          role="center"
          hyprState={hyprState}
          visible={centerVisibleOnMonitor}
          onHoverEnter={showCenter}
          onHoverLeave={hideCenter}
        />
      )}
      {shouldRenderRole(hyprState(), enabledRoles(), "center", connector) && (
        <WorkspaceRevealWindow
          gdkmonitor={gdkmonitor}
          role="center"
          hyprState={hyprState}
          visible={centerRevealVisible}
          onHover={showCenter}
        />
      )}
      {shouldRenderRole(hyprState(), enabledRoles(), "laptop", connector) && (
        <BarWindow
          gdkmonitor={gdkmonitor}
          role="laptop"
          hyprState={hyprState}
          visible={laptopVisibleOnMonitor}
          onHoverEnter={showCenter}
          onHoverLeave={hideCenter}
        />
      )}
      {shouldRenderRole(hyprState(), enabledRoles(), "laptop", connector) && (
        <WorkspaceRevealWindow
          gdkmonitor={gdkmonitor}
          role="laptop"
          hyprState={hyprState}
          visible={laptopRevealVisible}
          onHover={showCenter}
        />
      )}
    </>
  )
}
