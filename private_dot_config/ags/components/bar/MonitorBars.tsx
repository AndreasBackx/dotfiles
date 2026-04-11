import { Gdk } from "ags/gtk4"

import { centerAutoHideEnabled, centerTargetRole, connectorForRole, soloLaptopCenter } from "../../lib/bar-logic"
import type { BooleanAccessor, HyprState, HyprStateAccessor, Role } from "../../lib/types"

import BarWindow from "./BarWindow"
import WorkspaceRevealWindow from "./WorkspaceRevealWindow"

type MonitorBarsProps = {
  gdkmonitor: Gdk.Monitor
  hyprState: HyprStateAccessor
  centerVisible: BooleanAccessor
  workspaceStripVisible: BooleanAccessor
  showCenter: () => void
  hideCenter: () => void
}

function roleIsOnCurrentMonitor(state: HyprState, role: Role, connector: string) {
  return connectorForRole(state, role) === connector
}

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

export default function MonitorBars({
  gdkmonitor,
  hyprState,
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
      <BarWindow gdkmonitor={gdkmonitor} role="left" hyprState={hyprState} visible={leftVisible} />
      <BarWindow gdkmonitor={gdkmonitor} role="right" hyprState={hyprState} visible={rightVisible} />
      <BarWindow
        gdkmonitor={gdkmonitor}
        role="center"
        hyprState={hyprState}
        visible={centerVisibleOnMonitor}
        onHoverEnter={showCenter}
        onHoverLeave={hideCenter}
      />
      <BarWindow
        gdkmonitor={gdkmonitor}
        role="laptop"
        hyprState={hyprState}
        visible={laptopVisibleOnMonitor}
        onHoverEnter={showCenter}
        onHoverLeave={hideCenter}
      />
      <WorkspaceRevealWindow
        gdkmonitor={gdkmonitor}
        role="center"
        hyprState={hyprState}
        visible={centerRevealVisible}
        onHover={showCenter}
      />
      <WorkspaceRevealWindow
        gdkmonitor={gdkmonitor}
        role="laptop"
        hyprState={hyprState}
        visible={laptopRevealVisible}
        onHover={showCenter}
      />
    </>
  )
}
