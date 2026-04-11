import { Gdk } from "ags/gtk4"

import { centerAutoHideEnabled, centerTargetRole, connectorForRole, soloLaptopCenter } from "../../lib/bar-logic"
import type { BooleanAccessor, HyprStateAccessor } from "../../lib/types"

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

export default function MonitorBars({
  gdkmonitor,
  hyprState,
  centerVisible,
  workspaceStripVisible,
  showCenter,
  hideCenter,
}: MonitorBarsProps) {
  const connector = gdkmonitor.connector

  const leftVisible = hyprState((state) => !soloLaptopCenter(state) && connectorForRole(state, "left") === connector)
  const rightVisible = hyprState(
    (state) => !soloLaptopCenter(state) && connectorForRole(state, "right") === connector,
  )
  const centerVisibleOnMonitor = hyprState(
    (state) =>
      centerTargetRole(state) === "center" &&
      connectorForRole(state, "center") === connector &&
      (!centerAutoHideEnabled(state) || centerVisible()),
  )
  const laptopVisibleOnMonitor = hyprState(
    (state) =>
      centerTargetRole(state) === "laptop" &&
      connectorForRole(state, "laptop") === connector &&
      (!centerAutoHideEnabled(state) || centerVisible()),
  )
  const centerRevealVisible = hyprState(
    (state) =>
      centerTargetRole(state) === "center" &&
      connectorForRole(state, "center") === connector &&
      centerAutoHideEnabled(state) &&
      !centerVisible() &&
      workspaceStripVisible(),
  )
  const laptopRevealVisible = hyprState(
    (state) =>
      centerTargetRole(state) === "laptop" &&
      connectorForRole(state, "laptop") === connector &&
      centerAutoHideEnabled(state) &&
      !centerVisible() &&
      workspaceStripVisible(),
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
