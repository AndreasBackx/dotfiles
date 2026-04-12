import app from "ags/gtk4/app"
import { Gtk } from "ags/gtk4"
import { For, This, createBinding, createState, onCleanup } from "ags"
import { subprocess } from "ags/process"

import style from "./style.css"
import MonitorBars from "./components/bar/MonitorBars"
import { assignCenterWorkspacesToLaptop, centerAutoHideEnabled, soloLaptopCenter } from "./lib/bar-logic"
import { createCenterVisibilityController } from "./lib/center-visibility"
import {
  CENTER_HIDE_DELAY_MS,
  INITIAL_AUTOHIDE_DELAY_MS,
  WORKSPACE_STRIP_HIDE_DELAY_MS,
  command,
  parseJson,
} from "./lib/runtime"
import { closeTrackedPopovers, setHoverReporter, setPopoverVisibilityReporter } from "./lib/widget-helpers"
import type { HyprState } from "./lib/types"

let requestShowCenter: (() => void) | null = null
let requestShowWorkspaces: (() => void) | null = null

// Application entry point. It binds monitor state, subscribes to Hyprland
// workspace updates, and delegates center-bar visibility policy to the
// controller in `lib/center-visibility.ts`.
app.start({
  instanceName: "dotfiles-bar",
  css: style,
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

    // The helper script is the single source of truth for Hyprland monitor and
    // workspace state. Invalid JSON is ignored by `parseJson` and leaves the
    // previous state intact.
    const proc = subprocess(command("eww-workspaces", "listen", "json"), (stdout) => {
      const nextState = parseJson<HyprState>(stdout, hyprState.get())
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
    })

    onCleanup(() => {
      proc.kill()
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
