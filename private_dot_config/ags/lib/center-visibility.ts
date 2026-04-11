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

/**
 * Creates the timer-driven controller for the auto-hidden center bar.
 *
 * Example: `const visibility = createCenterVisibilityController({ ... })`
 */
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

  /** Cancels any pending center-bar hide timer. */
  const cancelCenterHide = () => {
    centerHideTimer?.cancel()
    centerHideTimer = null
  }

  /** Cancels the temporary workspace-strip reveal timer. */
  const cancelWorkspaceStripHide = () => {
    workspaceStripTimer?.cancel()
    workspaceStripTimer = null
  }

  /** Hides the center bar unless the pointer is still on an interactive surface. */
  const hideCenter = () => {
    if (shouldKeepCenterVisible()) {
      return
    }

    closeTrackedPopovers()
    setCenterVisible(false)
    cancelCenterHide()
  }

  /** Shows the temporary workspace strip used to recall the hidden center bar. */
  const showWorkspaceStrip = () => {
    setWorkspaceStripVisible(true)
    cancelWorkspaceStripHide()
    workspaceStripTimer = timeout(workspaceStripHideDelayMs, () => {
      setWorkspaceStripVisible(false)
      workspaceStripTimer = null
    })
  }

  /** Makes the center bar visible and clears any pending hide timers. */
  const showCenter = () => {
    cancelCenterHide()
    cancelWorkspaceStripHide()
    setWorkspaceStripVisible(false)
    setCenterVisible(true)
  }

  /** Starts or restarts the delayed auto-hide timer for the center bar. */
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

  /** Handles pointer exit from the center bar shell. */
  const handleCenterLeave = () => {
    scheduleCenterHide()
  }

  /** Updates hover bookkeeping for bar shells and tracked popovers. */
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

  /** Updates popover bookkeeping and keeps the center bar visible while opening. */
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

  /** Forces the non-autohide baseline state used on monitors without hiding. */
  const applyAutoHideState = () => {
    if (centerAutoHideEnabled(hyprState.get())) {
      return
    }

    cancelCenterHide()
    cancelWorkspaceStripHide()
    setWorkspaceStripVisible(false)
    setCenterVisible(true)
  }

  /** Clears timers and tracked interaction state during app shutdown. */
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
