import { Astal } from "ags/gtk4"

import config from "./config"
import { run } from "./runtime"
import type { HyprMonitor, HyprState, Role } from "./types"

// Monitor matching prefers stable serial numbers when they are available, while
// still allowing description-only matching on hosts without serial metadata.
export function monitorMatches(monitor: HyprMonitor, role: Role) {
  const target = config.monitorRoles[role]
  if (!target) {
    return false
  }

  if (target.serial && monitor.serial) {
    return target.serial === monitor.serial
  }

  return target.name === monitor.description
}

export function connectorForRole(state: HyprState, role: Role) {
  return state.monitors.find((monitor) => monitorMatches(monitor, role))?.connector ?? null
}

export function centerTargetRole(state: HyprState): Role {
  if (connectorForRole(state, "center")) {
    return "center"
  }

  if (config.monitorRoles.laptop && connectorForRole(state, "laptop")) {
    return "laptop"
  }

  return "center"
}

export function soloLaptopCenter(state: HyprState) {
  return (
    !!config.monitorRoles.laptop &&
    !!connectorForRole(state, "laptop") &&
    !connectorForRole(state, "left") &&
    !connectorForRole(state, "center") &&
    !connectorForRole(state, "right")
  )
}

export function centerAutoHideEnabled(state: HyprState) {
  const role = centerTargetRole(state)
  const target = config.monitorRoles[role]

  if (!target) {
    return false
  }

  if (role === "laptop") {
    return true
  }

  if (target.name === config.homeCenter.name) {
    return true
  }

  return !!target.serial && target.serial === config.homeCenter.serial
}

export function baseForRole(role: Role) {
  switch (role) {
    case "left":
      return 0
    case "center":
    case "laptop":
      return 100
    case "right":
      return 200
  }
}

export function barPositionForRole(role: Role) {
  return config.monitorRoles[role]?.barPosition ?? "bottom"
}

export function anchorForPosition(position: "top" | "bottom") {
  const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor
  return position === "top" ? TOP | LEFT | RIGHT : BOTTOM | LEFT | RIGHT
}

export function workspaceStripAnchorForPosition(position: "top" | "bottom") {
  const { TOP, BOTTOM, LEFT } = Astal.WindowAnchor
  return position === "top" ? TOP | LEFT : BOTTOM | LEFT
}

export function workspaceIdsForBase(base: number, state: HyprState) {
  const ids: number[] = []

  // Only render workspaces that are visible, active, or currently populated.
  for (let offset = 1; offset <= 12; offset += 1) {
    const id = base + offset
    const active = state.activeWorkspaceId === id
    const visible = state.visibleWorkspaceIds.includes(id)
    const populated = state.populatedWorkspaceIds.includes(id)

    if (active || visible || populated) {
      ids.push(id)
    }
  }

  return ids
}

export function workspaceLabel(base: number, id: number) {
  return `${id - base}`
}

export function workspaceClass(base: number, id: number, state: HyprState) {
  const classes = ["workspace-btn"]

  if (state.activeWorkspaceId === id) {
    classes.push("active")
  } else if (state.visibleWorkspaceIds.includes(id)) {
    classes.push("shown")
  }

  if (state.populatedWorkspaceIds.includes(id)) {
    classes.push("occupied")
  }

  return classes.join(" ")
}

export function assignCenterWorkspacesToLaptop() {
  if (!config.monitorRoles.laptop) {
    return
  }

  // When the laptop is the only remaining display, keep the center workspace
  // range attached to it so the visible strip still matches Hyprland routing.
  for (let workspace = 101; workspace <= 112; workspace += 1) {
    run(["hyprctl", "keyword", "workspace", `${workspace},monitor:desc:${config.monitorRoles.laptop.name}`])
  }
}
