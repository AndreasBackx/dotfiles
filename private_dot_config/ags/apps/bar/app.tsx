import Hyprland from "gi://AstalHyprland"

import app from "ags/gtk4/app"
import { Gtk } from "ags/gtk4"
import { For, This, createBinding, createState, onCleanup } from "ags"

import commonBaseCss from "../../common/theming/base.css"
import themeCss from "./theming/theme.css"
import appCss from "./theming/app.css"
import barRootCss from "./components/bar/BarRoot.css"
import barWindowCss from "./components/bar/BarWindow.css"
import workspaceRevealCss from "./components/bar/WorkspaceRevealWindow.css"
import spotifyCss from "./components/spotify/SpotifySegment.css"
import bluetoothCss from "./components/system/BluetoothButton.css"
import batteryCss from "./components/system/BatteryButton.css"
import clockCss from "./components/system/ClockButton.css"
import networkCss from "./components/system/NetworkButton.css"
import systemSharedCss from "./components/system/shared.css"
import systemMenuButtonCss from "./components/system/SystemMenuButton.css"
import systemSegmentCss from "./components/system/SystemSegment.css"
import titleCss from "./components/title/TitleSegment.css"
import workspaceButtonCss from "./components/workspaces/WorkspaceButton.css"
import workspaceStripCss from "./components/workspaces/WorkspaceStrip.css"
import MonitorBars from "./components/bar/MonitorBars"
import { assignCenterWorkspacesToLaptop, centerAutoHideEnabled, soloLaptopCenter } from "./utils/bar-logic"
import { createCenterVisibilityController } from "./utils/center-visibility"
import {
  CENTER_HIDE_DELAY_MS,
  INITIAL_AUTOHIDE_DELAY_MS,
  WORKSPACE_STRIP_HIDE_DELAY_MS,
} from "./utils/runtime"
import { closeTrackedPopovers, setHoverReporter, setPopoverVisibilityReporter } from "./utils/widget-helpers"
import type { HyprState } from "./utils/types"

let requestShowCenter: (() => void) | null = null
let requestShowWorkspaces: (() => void) | null = null

function buildHyprState(hyprland: Hyprland.Hyprland | null): HyprState {
  if (!hyprland) {
    return {
      activeWorkspaceId: 1,
      visibleWorkspaceIds: [],
      populatedWorkspaceIds: [],
      monitors: [],
      windowTitle: "Desktop",
    }
  }

  return {
    activeWorkspaceId: hyprland.focusedWorkspace?.id ?? 1,
    visibleWorkspaceIds: hyprland.monitors.map((monitor) => monitor.activeWorkspace?.id ?? 0).filter(Boolean),
    populatedWorkspaceIds: hyprland.workspaces.filter((workspace) => workspace.clients.length > 0).map((workspace) => workspace.id),
    monitors: hyprland.monitors.map((monitor) => ({
      connector: monitor.name,
      description: monitor.description,
      serial: monitor.serial,
      activeWorkspaceId: monitor.activeWorkspace?.id ?? 0,
    })),
    windowTitle: hyprland.focusedClient?.title || "Desktop",
  }
}

const css = [
  commonBaseCss,
  themeCss,
  appCss,
  barWindowCss,
  workspaceRevealCss,
  barRootCss,
  workspaceStripCss,
  workspaceButtonCss,
  titleCss,
  spotifyCss,
  systemSharedCss,
  systemSegmentCss,
  systemMenuButtonCss,
  batteryCss,
  networkCss,
  bluetoothCss,
  clockCss,
].join("\n")

// Application entry point. It binds monitor state, subscribes to Hyprland
// workspace updates, and delegates center-bar visibility policy to the
// controller in `utils/center-visibility.ts`.
app.start({
  instanceName: "dotfiles-bar",
  css,
  gtkTheme: "Adwaita-dark",
  requestHandler(argv, response) {
    switch (argv[0]) {
      case "show-center":
        requestShowCenter?.()
        response("ok")
        return
      case "show-workspaces":
        requestShowWorkspaces?.()
        response("ok")
        return
      default:
        response("unknown command")
    }
  },
  main() {
    const settings = Gtk.Settings.get_default()
    settings?.set_property("gtk-application-prefer-dark-theme", true)
    settings?.set_property("gtk-tooltip-timeout", 120)
    settings?.set_property("gtk-tooltip-browse-timeout", 60)
    settings?.set_property("gtk-tooltip-browse-mode-timeout", 120)

    const monitors = createBinding(app, "monitors")
    const hyprland = Hyprland.get_default()
    const [hyprState, setHyprState] = createState<HyprState>({
      activeWorkspaceId: 1,
      visibleWorkspaceIds: [],
      populatedWorkspaceIds: [],
      monitors: [],
      windowTitle: "Desktop",
    })
    const [centerVisible, setCenterVisible] = createState(true)
    const [workspaceStripVisible, setWorkspaceStripVisible] = createState(false)

    let initialAutohideScheduled = false
    const visibility = createCenterVisibilityController({
      hyprState,
      centerVisible,
      setCenterVisible,
      setWorkspaceStripVisible,
      centerHideDelayMs: CENTER_HIDE_DELAY_MS,
      workspaceStripHideDelayMs: WORKSPACE_STRIP_HIDE_DELAY_MS,
      closeTrackedPopovers,
    })

    requestShowCenter = visibility.showCenter
    requestShowWorkspaces = visibility.showWorkspaceStrip
    setHoverReporter(visibility.handleHoverChange)
    setPopoverVisibilityReporter(visibility.handlePopoverVisibilityChange)

    const syncHyprState = () => {
      const nextState = buildHyprState(hyprland)
      setHyprState(nextState)

      if (soloLaptopCenter(nextState)) {
        assignCenterWorkspacesToLaptop()
      }

      if (centerAutoHideEnabled(nextState)) {
        if (!initialAutohideScheduled) {
          initialAutohideScheduled = true
          visibility.scheduleCenterHide(INITIAL_AUTOHIDE_DELAY_MS)
        }
      } else {
        initialAutohideScheduled = false
        visibility.applyAutoHideState()
      }
    }

    const hyprlandEventId = hyprland?.connect("event", syncHyprState) ?? 0
    syncHyprState()

    onCleanup(() => {
      if (hyprland && hyprlandEventId) {
        hyprland.disconnect(hyprlandEventId)
      }

      visibility.cleanup()
      requestShowCenter = null
      requestShowWorkspaces = null
      setHoverReporter(null)
      setPopoverVisibilityReporter(null)
    })

    return (
      <For each={monitors}>
        {(monitor) => (
          <This this={app}>
            <MonitorBars
              gdkmonitor={monitor}
              hyprState={hyprState}
              centerVisible={centerVisible}
              workspaceStripVisible={workspaceStripVisible}
              showCenter={visibility.showCenter}
              hideCenter={visibility.handleCenterLeave}
            />
          </This>
        )}
      </For>
    )
  },
})
