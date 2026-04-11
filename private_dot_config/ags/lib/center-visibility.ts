import { timeout } from "ags/time"

import { centerAutoHideEnabled } from "./bar-logic"
import type { BooleanAccessor, HyprStateAccessor } from "./types"

type CenterVisibilityControllerOptions = {
  hyprState: HyprStateAccessor
  centerVisible: BooleanAccessor
  setCenterVisible: (visible: boolean) => void
  setWorkspaceStripVisible: (visible: boolean) => void
  centerHideDelayMs: number
  workspaceStripHideDelayMs: number
  closeTrackedPopovers: () => void
}

type HoverReporter = (id: string, hovered: boolean) => void
type PopoverReporter = (id: string, open: boolean) => void

export type CenterVisibilityController = {
  showCenter: () => void
  handleCenterLeave: () => void
  showWorkspaceStrip: () => void
  scheduleCenterHide: (delay?: number) => void
  applyAutoHideState: () => void
  handleHoverChange: HoverReporter
  handlePopoverVisibilityChange: PopoverReporter
  cleanup: () => void
}

// This module owns the timer-driven visibility policy for the auto-hidden center
// bar so `app.tsx` can focus on wiring external state into the UI.
export function createCenterVisibilityController({
  hyprState,
  centerVisible,
  setCenterVisible,
  setWorkspaceStripVisible,
  centerHideDelayMs,
  workspaceStripHideDelayMs,
  closeTrackedPopovers,
}: CenterVisibilityControllerOptions): CenterVisibilityController {
  let centerHideTimer: ReturnType<typeof timeout> | null = null
  let workspaceStripTimer: ReturnType<typeof timeout> | null = null
  const hoveredSurfaceIds = new Set<string>()
  const openPopoverIds = new Set<string>()

  // Preserve current behavior: hover state is the only condition that blocks a
  // pending hide. Open popovers call `showCenter()` and may trigger a new hide
  // only after they close, but they do not independently veto hiding here.
  const shouldKeepCenterVisible = () => hoveredSurfaceIds.size > 0

  const cancelCenterHide = () => {
    centerHideTimer?.cancel()
    centerHideTimer = null
  }

  const cancelWorkspaceStripHide = () => {
    workspaceStripTimer?.cancel()
    workspaceStripTimer = null
  }

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
    workspaceStripTimer = timeout(workspaceStripHideDelayMs, () => {
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

  const scheduleCenterHide = (delay = centerHideDelayMs) => {
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

  const handleCenterLeave = () => {
    scheduleCenterHide()
  }

  const handleHoverChange: HoverReporter = (id, hovered) => {
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
  }

  const handlePopoverVisibilityChange: PopoverReporter = (id, open) => {
    if (open) {
      openPopoverIds.add(id)
      showCenter()
      return
    }

    openPopoverIds.delete(id)

    if (!shouldKeepCenterVisible()) {
      scheduleCenterHide()
    }
  }

  const applyAutoHideState = () => {
    if (centerAutoHideEnabled(hyprState.get())) {
      return
    }

    cancelCenterHide()
    cancelWorkspaceStripHide()
    setWorkspaceStripVisible(false)
    setCenterVisible(true)
  }

  const cleanup = () => {
    cancelCenterHide()
    cancelWorkspaceStripHide()
    hoveredSurfaceIds.clear()
    openPopoverIds.clear()
  }

  return {
    showCenter,
    handleCenterLeave,
    showWorkspaceStrip,
    scheduleCenterHide,
    applyAutoHideState,
    handleHoverChange,
    handlePopoverVisibilityChange,
    cleanup,
  }
}
