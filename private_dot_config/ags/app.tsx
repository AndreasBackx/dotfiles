import app from "ags/gtk4/app"
import { For, This, createBinding, createState, onCleanup } from "ags"
import { timeout } from "ags/time"
import { subprocess } from "ags/process"

import style from "./style.css"
import MonitorBars from "./components/bar/MonitorBars"
import { assignCenterWorkspacesToLaptop, centerAutoHideEnabled, soloLaptopCenter } from "./lib/bar-logic"
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

app.start({
  instanceName: "dotfiles-bar",
  css: style,
  gtkTheme: "Adwaita",
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
    let centerHideTimer: ReturnType<typeof timeout> | null = null
    let workspaceStripTimer: ReturnType<typeof timeout> | null = null
    const hoveredSurfaceIds = new Set<string>()
    const openPopoverIds = new Set<string>()

    // Hover and popover state are tracked centrally because the auto-hidden
    // center segment spans multiple bar windows and transient popovers.
    const cancelCenterHide = () => {
      centerHideTimer?.cancel()
      centerHideTimer = null
    }

    const cancelWorkspaceStripHide = () => {
      workspaceStripTimer?.cancel()
      workspaceStripTimer = null
    }

    const shouldKeepCenterVisible = () => hoveredSurfaceIds.size > 0

    const hideCenter = () => {
      if (shouldKeepCenterVisible()) {
        return
      }

      closeTrackedPopovers()
      setCenterVisible(false)
      cancelCenterHide()
    }

    const showWorkspaceStrip = () => {
      setWorkspaceStripVisible(true)
      cancelWorkspaceStripHide()
      workspaceStripTimer = timeout(WORKSPACE_STRIP_HIDE_DELAY_MS, () => {
        setWorkspaceStripVisible(false)
        workspaceStripTimer = null
      })
    }

    const showCenter = () => {
      cancelCenterHide()
      cancelWorkspaceStripHide()
      setWorkspaceStripVisible(false)
      setCenterVisible(true)
    }

    const handleCenterLeave = () => {
      scheduleCenterHide()
    }

    const scheduleCenterHide = (delay = CENTER_HIDE_DELAY_MS) => {
      if (!centerAutoHideEnabled(hyprState.get()) || shouldKeepCenterVisible()) {
        return
      }

      cancelCenterHide()
      centerHideTimer = timeout(delay, () => {
        centerHideTimer = null

        if (!centerAutoHideEnabled(hyprState.get()) || !centerVisible.get() || shouldKeepCenterVisible()) {
          return
        }

        hideCenter()
      })
    }

    requestShowCenter = showCenter
    requestShowWorkspaces = showWorkspaceStrip
    setHoverReporter((id, hovered) => {
      if (hovered) {
        hoveredSurfaceIds.add(id)
        cancelCenterHide()
        if (!centerVisible.get()) {
          showCenter()
        }
        return
      }

      hoveredSurfaceIds.delete(id)

      if (hoveredSurfaceIds.size === 0) {
        scheduleCenterHide()
      }
    })

    setPopoverVisibilityReporter((id, open) => {
      if (open) {
        openPopoverIds.add(id)
        showCenter()
        return
      }

      openPopoverIds.delete(id)

      if (!shouldKeepCenterVisible()) {
        scheduleCenterHide()
      }
    })

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
          scheduleCenterHide(INITIAL_AUTOHIDE_DELAY_MS)
        }
      } else {
        initialAutohideScheduled = false
        cancelCenterHide()
        cancelWorkspaceStripHide()
        setWorkspaceStripVisible(false)
        setCenterVisible(true)
      }
    })

    onCleanup(() => {
      proc.kill()
      cancelCenterHide()
      cancelWorkspaceStripHide()
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
              showCenter={showCenter}
              hideCenter={handleCenterLeave}
            />
          </This>
        )}
      </For>
    )
  },
})
