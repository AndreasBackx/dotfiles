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
  POINTER_IDLE_HIDE_DELAY_MS,
  WORKSPACE_STRIP_HIDE_DELAY_MS,
  command,
  parseJson,
} from "./lib/runtime"
import { setPointerActivityReporter, setPopoverVisibilityReporter } from "./lib/widget-helpers"
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
    let pointerIdleTimer: ReturnType<typeof timeout> | null = null
    let workspaceStripTimer: ReturnType<typeof timeout> | null = null
    let lastPointerActivityAt = Date.now()
    let openPopoverCount = 0

    const cancelCenterHide = () => {
      centerHideTimer?.cancel()
      centerHideTimer = null
    }

    const cancelPointerIdleHide = () => {
      pointerIdleTimer?.cancel()
      pointerIdleTimer = null
    }

    const cancelWorkspaceStripHide = () => {
      workspaceStripTimer?.cancel()
      workspaceStripTimer = null
    }

    const hideCenter = () => {
      if (openPopoverCount > 0) {
        return
      }

      setCenterVisible(false)
      cancelCenterHide()
      cancelPointerIdleHide()
    }

    const showWorkspaceStrip = () => {
      setWorkspaceStripVisible(true)
      cancelWorkspaceStripHide()
      workspaceStripTimer = timeout(WORKSPACE_STRIP_HIDE_DELAY_MS, () => {
        setWorkspaceStripVisible(false)
        workspaceStripTimer = null
      })
    }

    const schedulePointerIdleHide = (delay = POINTER_IDLE_HIDE_DELAY_MS) => {
      if (!centerAutoHideEnabled(hyprState.get()) || openPopoverCount > 0 || !centerVisible.get()) {
        return
      }

      cancelPointerIdleHide()
      pointerIdleTimer = timeout(delay, () => {
        pointerIdleTimer = null

        if (openPopoverCount > 0 || !centerAutoHideEnabled(hyprState.get()) || !centerVisible.get()) {
          return
        }

        const idleFor = Date.now() - lastPointerActivityAt

        if (idleFor < POINTER_IDLE_HIDE_DELAY_MS) {
          schedulePointerIdleHide(POINTER_IDLE_HIDE_DELAY_MS - idleFor)
          return
        }

        hideCenter()
      })
    }

    const notePointerActivity = () => {
      lastPointerActivityAt = Date.now()

      if (centerVisible.get()) {
        schedulePointerIdleHide()
      }
    }

    const showCenter = () => {
      notePointerActivity()
      cancelCenterHide()
      cancelWorkspaceStripHide()
      setWorkspaceStripVisible(false)
      setCenterVisible(true)
      schedulePointerIdleHide()
    }

    const scheduleCenterHide = (delay = CENTER_HIDE_DELAY_MS) => {
      if (!centerAutoHideEnabled(hyprState.get()) || openPopoverCount > 0) {
        return
      }

      cancelCenterHide()
      centerHideTimer = timeout(delay, () => {
        centerHideTimer = null

        if (openPopoverCount > 0 || !centerAutoHideEnabled(hyprState.get()) || !centerVisible.get()) {
          return
        }

        const idleFor = Date.now() - lastPointerActivityAt

        if (idleFor < POINTER_IDLE_HIDE_DELAY_MS) {
          schedulePointerIdleHide(POINTER_IDLE_HIDE_DELAY_MS - idleFor)
          return
        }

        hideCenter()
      })
    }

    requestShowCenter = showCenter
    requestShowWorkspaces = showWorkspaceStrip
    setPointerActivityReporter(notePointerActivity)

    setPopoverVisibilityReporter((open) => {
      if (open) {
        openPopoverCount += 1
        showCenter()
        cancelPointerIdleHide()
        return
      }

      openPopoverCount = Math.max(0, openPopoverCount - 1)

      if (openPopoverCount === 0) {
        scheduleCenterHide()
        schedulePointerIdleHide()
      }
    })

    const proc = subprocess(command("eww-workspaces", "listen", "json"), (stdout) => {
      const nextState = parseJson<HyprState>(stdout, hyprState.get())
      const previousState = hyprState.get()
      const workspaceChanged = nextState.activeWorkspaceId !== previousState.activeWorkspaceId
      setHyprState(nextState)

      if (soloLaptopCenter(nextState)) {
        assignCenterWorkspacesToLaptop()
      }

      if (centerAutoHideEnabled(nextState)) {
        if (!initialAutohideScheduled) {
          initialAutohideScheduled = true
          scheduleCenterHide(INITIAL_AUTOHIDE_DELAY_MS)
        }

        if (workspaceChanged && !centerVisible.get()) {
          showWorkspaceStrip()
        }
      } else {
        initialAutohideScheduled = false
        cancelCenterHide()
        cancelPointerIdleHide()
        cancelWorkspaceStripHide()
        setWorkspaceStripVisible(false)
        setCenterVisible(true)
      }
    })

    onCleanup(() => {
      proc.kill()
      cancelCenterHide()
      cancelPointerIdleHide()
      cancelWorkspaceStripHide()
      requestShowCenter = null
      requestShowWorkspaces = null
      setPointerActivityReporter(null)
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
              hideCenter={hideCenter}
            />
          </This>
        )}
      </For>
    )
  },
})
