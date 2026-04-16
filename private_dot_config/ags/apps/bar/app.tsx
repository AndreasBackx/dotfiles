import Hyprland from "gi://AstalHyprland"

import app from "ags/gtk4/app"
import { Gtk } from "ags/gtk4"
import { For, This, createBinding, createState, onCleanup } from "ags"

import commonBaseCss from "../../common/theming/base.css"
import themeCss from "./theming/theme.css"
import appCss from "./theming/app.css"
import batteryCss from "./components/battery/BatteryButton.css"
import barRootCss from "./components/bar/BarRoot.css"
import barWindowCss from "./components/bar/BarWindow.css"
import bluetoothCss from "./components/bluetooth/BluetoothButton.css"
import clockCss from "./components/clock/ClockButton.css"
import displaysCss from "./components/displays/DisplaysButton.css"
import networkCss from "./components/network/NetworkButton.css"
import workspaceRevealCss from "./components/bar/WorkspaceRevealWindow.css"
import spotifyCss from "./components/spotify/SpotifySegment.css"
import systemSharedCss from "./components/system/shared.css"
import systemMenuButtonCss from "./components/system/SystemMenuButton.css"
import systemSegmentCss from "./components/system/SystemSegment.css"
import titleCss from "./components/title/TitleSegment.css"
import workspaceButtonCss from "./components/workspaces/WorkspaceButton.css"
import workspaceStripCss from "./components/workspaces/WorkspaceStrip.css"
import MonitorBars from "./components/bar/MonitorBars"
import { assignCenterWorkspacesToLaptop, centerAutoHideEnabled, centerTargetRole, soloLaptopCenter } from "./utils/bar-logic"
import { createCenterVisibilityController } from "./utils/center-visibility"
import {
  CENTER_HIDE_DELAY_MS,
  HOME,
  INITIAL_AUTOHIDE_DELAY_MS,
  WORKSPACE_STRIP_HIDE_DELAY_MS,
  parseJson,
  readTextFile,
} from "./utils/runtime"
import { closeTrackedPopovers, setHoverReporter, setPopoverVisibilityReporter } from "./utils/widget-helpers"
import type { HyprState, Role } from "./utils/types"

let requestShowCenter: (() => void) | null = null
let requestShowWorkspaces: (() => void) | null = null
let requestSetProfile: ((profile: string) => void) | null = null

const WORKSPACE_ROUTING_PATH = `${HOME}/.config/hypr/workspace-routing.json`
const ROLE_ORDER = ["left", "center", "right", "laptop"] as const satisfies readonly Role[]
const DEFAULT_ENABLED_ROLES = ["laptop"] as const satisfies readonly Role[]

type WorkspaceRoutingConfig = {
  defaultProfile: string
  monitors: Partial<Record<Role | "tv", { profiles?: string[] }>>
}

function enabledRolesForProfile(profile: string): Role[] {
  const config = parseJson<WorkspaceRoutingConfig>(readTextFile(WORKSPACE_ROUTING_PATH, "{}"), {
    defaultProfile: "",
    monitors: {},
  })

  const enabledRoles = ROLE_ORDER.filter((role) => config.monitors[role]?.profiles?.includes(profile))

  return enabledRoles.length > 0 ? [...enabledRoles] : [...DEFAULT_ENABLED_ROLES]
}

function centerRoleEnabled(state: HyprState, enabledRoles: Role[]) {
  return enabledRoles.includes(centerTargetRole(state))
}

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
  displaysCss,
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
      case "set-profile": {
        const profile = argv[1]?.trim()

        if (!profile) {
          response("missing profile")
          return
        }

        requestSetProfile?.(profile)
        response("ok")
        return
      }
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
    // TODO: query shikane for the active profile on startup once shikane exposes it; until then default to the laptop bar.
    const [enabledRoles, setEnabledRoles] = createState<Role[]>([...DEFAULT_ENABLED_ROLES])
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

    const syncBarLayout = (nextState: HyprState, roles = enabledRoles()) => {
      if (soloLaptopCenter(nextState) && roles.includes("laptop")) {
        assignCenterWorkspacesToLaptop()
      }

      if (centerRoleEnabled(nextState, roles) && centerAutoHideEnabled(nextState)) {
        if (!initialAutohideScheduled) {
          initialAutohideScheduled = true
          visibility.scheduleCenterHide(INITIAL_AUTOHIDE_DELAY_MS)
        }

        return
      }

      initialAutohideScheduled = false
      visibility.applyAutoHideState()
    }

    requestSetProfile = (profile) => {
      const nextRoles = enabledRolesForProfile(profile)
      setEnabledRoles(nextRoles)
      syncBarLayout(hyprState.get(), nextRoles)
    }

    const syncHyprState = () => {
      const nextState = buildHyprState(hyprland)
      setHyprState(nextState)
      syncBarLayout(nextState)
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
      requestSetProfile = null
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
              enabledRoles={enabledRoles}
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
