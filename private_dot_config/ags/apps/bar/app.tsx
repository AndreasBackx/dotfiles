import Hyprland from "gi://AstalHyprland"
import Adw from "gi://Adw"
import GLib from "gi://GLib?version=2.0"

import app from "ags/gtk4/app"
import { Gdk, Gtk } from "ags/gtk4"
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
import backupCss from "./components/backup/BackupButton.css"
import systemMenuButtonCss from "./components/system/SystemMenuButton.css"
import systemSegmentCss from "./components/system/SystemSegment.css"
import titleCss from "./components/title/TitleSegment.css"
import trayCss from "./components/tray/TraySegment.css"
import workspaceButtonCss from "./components/workspaces/WorkspaceButton.css"
import workspaceStripCss from "./components/workspaces/WorkspaceStrip.css"
import BarWindow from "./components/bar/BarWindow"
import WorkspaceRevealWindow from "./components/bar/WorkspaceRevealWindow"
import config from "./utils/config"
import { assignCenterWorkspacesToLaptop, centerAutoHideEnabled, centerTargetRole, connectorForRole, soloLaptopCenter } from "./utils/bar-logic"
import { createCenterVisibilityController } from "./utils/center-visibility"
import { logShowCenterStage, markShowCenterRequest } from "./utils/perf"
import {
  CENTER_HIDE_DELAY_MS,
  INITIAL_AUTOHIDE_DELAY_MS,
  WORKSPACE_STRIP_HIDE_DELAY_MS,
  readCommandOutput,
  currentCompositor,
  parseJson,
} from "./utils/runtime"
import { closeTrackedPopovers, setHoverReporter, setPopoverVisibilityReporter } from "./utils/widget-helpers"
import type { HyprState, Role } from "./utils/types"

let requestShowCenter: (() => void) | null = null
let requestShowWorkspaces: (() => void) | null = null
let requestSetProfile: ((profile: string) => void) | null = null

const ROLE_ORDER = ["left", "center", "right", "laptop"] as const satisfies readonly Role[]
const DEFAULT_ENABLED_ROLES = ["laptop"] as const satisfies readonly Role[]

type WindowItem = {
  key: string
  role: Role
  monitor: Gdk.Monitor
}

type WindowKind = "bar" | "reveal"

type WindowSpec = {
  role: Role
  kind: WindowKind
}

const WINDOW_SPECS = [
  { role: "left", kind: "bar" },
  { role: "right", kind: "bar" },
  { role: "center", kind: "bar" },
  { role: "center", kind: "reveal" },
  { role: "laptop", kind: "bar" },
  { role: "laptop", kind: "reveal" },
] as const satisfies readonly WindowSpec[]

function enabledRolesForProfile(profile: string): Role[] {
  const enabledRoles = ROLE_ORDER.filter((role) => config.monitorRoles[role]?.profiles.includes(profile))

  return enabledRoles.length > 0 ? [...enabledRoles] : [...DEFAULT_ENABLED_ROLES]
}

function startupProfile() {
  return readCommandOutput(["shikanectl", "current"], config.defaultProfile).trim()
}

function centerRoleEnabled(state: HyprState, enabledRoles: Role[]) {
  return enabledRoles.includes(centerTargetRole(state))
}

function shouldRenderRole(state: HyprState, enabledRoles: Role[], role: Role, connector: string) {
  if (!enabledRoles.includes(role) || connectorForRole(state, role) !== connector) {
    return false
  }

  if (role === "left" || role === "right") {
    return !soloLaptopCenter(state)
  }

  return true
}

function monitorItemsForRole(state: HyprState, enabledRoles: Role[], role: Role, monitors: Gdk.Monitor[]) {
  const items: WindowItem[] = []

  for (const monitor of monitors) {
    const connector = monitor.connector

    if (shouldRenderRole(state, enabledRoles, role, connector)) {
      items.push({ key: `${role}-${connector}`, role, monitor })
    }
  }

  return items
}

function barVisibleForRole(role: Role, connector: string, hyprState: ReturnType<typeof createState<HyprState>>[0], centerVisible: ReturnType<typeof createState<boolean>>[0]) {
  if (role === "left" || role === "right") {
    return hyprState((state) => !soloLaptopCenter(state) && connectorForRole(state, role) === connector)
  }

  return hyprState((state) => {
    const targetRole = centerTargetRole(state)

    return targetRole === role && connectorForRole(state, role) === connector && (!centerAutoHideEnabled(state) || centerVisible())
  })
}

function barExclusiveForRole(role: Role, connector: string, hyprState: ReturnType<typeof createState<HyprState>>[0]) {
  if (role === "left" || role === "right") {
    return hyprState((state) => !soloLaptopCenter(state) && connectorForRole(state, role) === connector)
  }

  return hyprState((state) => {
    const targetRole = centerTargetRole(state)

    return targetRole === role && connectorForRole(state, role) === connector && !centerAutoHideEnabled(state)
  })
}

function revealVisibleForRole(
  role: Role,
  connector: string,
  hyprState: ReturnType<typeof createState<HyprState>>[0],
  centerVisible: ReturnType<typeof createState<boolean>>[0],
  workspaceStripVisible: ReturnType<typeof createState<boolean>>[0],
) {
  return hyprState((state) => {
    const targetRole = centerTargetRole(state)

    return (
      targetRole === role &&
      connectorForRole(state, role) === connector &&
      centerAutoHideEnabled(state) &&
      !centerVisible() &&
      workspaceStripVisible()
    )
  })
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

type NiriOutput = {
  name?: string
  make?: string
  model?: string
  serial?: string | null
  logical?: object | null
}

function buildNiriState(): HyprState {
  const outputs = parseJson<NiriOutput[]>(readCommandOutput(["niri", "msg", "--json", "outputs"], "[]"), [])

  return {
    activeWorkspaceId: 1,
    visibleWorkspaceIds: [],
    populatedWorkspaceIds: [],
    monitors: outputs
      .filter((output) => output.logical !== null)
      .map((output) => ({
        connector: output.name ?? "",
        description: [output.make ?? "", output.model ?? "", output.serial ?? ""].filter(Boolean).join(" "),
        serial: output.serial ?? "",
        activeWorkspaceId: 0,
      })),
    windowTitle: "Desktop",
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
  trayCss,
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
        markShowCenterRequest()
        logShowCenterStage("show-center before handler")
        requestShowCenter?.()
        logShowCenterStage("show-center after handler")
        response("ok")
        logShowCenterStage("show-center response sent")
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
    Adw.StyleManager.get_default()?.set_color_scheme(Adw.ColorScheme.FORCE_DARK)

    const compositor = currentCompositor()
    const showWorkspaceStrip = compositor === "hyprland"
    const monitors = createBinding(app, "monitors")
    const hyprland = compositor === "hyprland" ? Hyprland.get_default() : null
    const [hyprState, setHyprState] = createState<HyprState>({
      activeWorkspaceId: 1,
      visibleWorkspaceIds: [],
      populatedWorkspaceIds: [],
      monitors: [],
      windowTitle: "Desktop",
    })
    const startupProfileName = startupProfile()
    const [enabledRoles, setEnabledRoles] = createState<Role[]>(
      startupProfileName ? enabledRolesForProfile(startupProfileName) : [...DEFAULT_ENABLED_ROLES],
    )
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
    const windowItemAccessors = WINDOW_SPECS.map((spec) => ({
      spec,
      items: monitors((value) => monitorItemsForRole(hyprState(), enabledRoles(), spec.role, value)),
    }))

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
      if (compositor === "hyprland") {
        syncBarLayout(hyprState.get(), nextRoles)
      }
    }

    const syncHyprState = () => {
      const nextState = compositor === "niri" ? buildNiriState() : buildHyprState(hyprland)
      setHyprState(nextState)
      if (compositor === "hyprland") {
        syncBarLayout(nextState)
      }
    }

    const hyprlandEventId = hyprland?.connect("event", syncHyprState) ?? 0
    const niriPollId = compositor === "niri" ? GLib.timeout_add(GLib.PRIORITY_DEFAULT, 2000, () => {
      syncHyprState()
      return GLib.SOURCE_CONTINUE
    }) : 0
    syncHyprState()

    onCleanup(() => {
      if (hyprland && hyprlandEventId) {
        hyprland.disconnect(hyprlandEventId)
      }

      if (niriPollId) {
        GLib.source_remove(niriPollId)
      }

      visibility.cleanup()
      requestShowCenter = null
      requestShowWorkspaces = null
      requestSetProfile = null
      setHoverReporter(null)
      setPopoverVisibilityReporter(null)
    })

    return windowItemAccessors.map(({ spec, items }) => (
      <For each={items} id={(item) => item.key}>
        {(item) => (
          <This this={app}>
            {spec.kind === "bar" ? (
              <BarWindow
                gdkmonitor={item.monitor}
                role={spec.role}
                hyprState={hyprState}
                visible={barVisibleForRole(spec.role, item.monitor.connector, hyprState, centerVisible)}
                exclusive={barExclusiveForRole(spec.role, item.monitor.connector, hyprState)}
                showWorkspaceStrip={showWorkspaceStrip}
                onHoverEnter={spec.role === "center" || spec.role === "laptop" ? visibility.showCenter : undefined}
                onHoverLeave={spec.role === "center" || spec.role === "laptop" ? visibility.handleCenterLeave : undefined}
              />
            ) : (
              <WorkspaceRevealWindow
                gdkmonitor={item.monitor}
                role={spec.role}
                hyprState={hyprState}
                visible={revealVisibleForRole(spec.role, item.monitor.connector, hyprState, centerVisible, workspaceStripVisible)}
                onHover={visibility.showCenter}
              />
            )}
          </This>
        )}
      </For>
    ))
  },
})
