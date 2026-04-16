import { createState } from "ags"

import type { StateAccessor } from "../../../common/utils/state"

type InstanceActivityState = {
  active: StateAccessor<boolean>
  visible: StateAccessor<boolean>
  popoverOpen: StateAccessor<boolean>
  setVisible: (visible: boolean) => void
  setPopoverOpen: (open: boolean) => void
}

const instances = new Map<string, InstanceActivityState>()

/**
 * Creates or returns the shared activity state for one bar instance.
 *
 * An instance is currently identified by `<role>-<connector>`, which matches
 * how `BarWindow` already derives its `instanceId`. The state is intentionally
 * coarse-grained:
 * - `visible`: the bar window is mapped and meant to be on screen
 * - `popoverOpen`: a widget popover inside that bar is currently open
 * - `active`: either of the above is true
 *
 * The `active` accessor is what visibility-aware pollers should listen to. It
 * lets a widget continue updating while its popover is open even if the parent
 * bar would otherwise be considered hidden.
 */
function ensureInstance(instanceId: string): InstanceActivityState {
  const existing = instances.get(instanceId)
  if (existing) {
    return existing
  }

  const [visible, setVisible] = createState(false)
  const [popoverOpen, setPopoverOpen] = createState(false)

  // `createState` only gives us primitive state cells. We derive a synthetic
  // accessor for "active" here so widgets can subscribe to one value instead of
  // wiring visibility and popover-open tracking separately.
  const active = ((map?: (value: boolean) => boolean) => {
    const value = visible.get() || popoverOpen.get()
    return typeof map === "function" ? map(value) : value
  }) as StateAccessor<boolean> & { subscribe(callback: () => void): () => void }
  active.get = () => visible.get() || popoverOpen.get()
  active.subscribe = (callback: () => void) => {
    // Forward both underlying subscriptions through one cleanup handle so the
    // consumer can treat `active` like a normal reactive source.
    const disposeVisible = (visible as any).subscribe?.(callback) ?? (() => {})
    const disposePopover = (popoverOpen as any).subscribe?.(callback) ?? (() => {})
    return () => {
      disposeVisible()
      disposePopover()
    }
  }

  const state = {
    active,
    visible,
    popoverOpen,
    setVisible,
    setPopoverOpen,
  }
  instances.set(instanceId, state)
  return state
}

/** Returns whether the instance should currently run fast/foreground updates. */
export function instanceActive(instanceId: string) {
  return ensureInstance(instanceId).active
}

/** Returns the raw window visibility accessor for an instance. */
export function instanceVisible(instanceId: string) {
  return ensureInstance(instanceId).visible
}

/** Called by bar windows when their mapped visibility changes. */
export function setInstanceVisible(instanceId: string, visible: boolean) {
  ensureInstance(instanceId).setVisible(visible)
}

/** Called by popover-owning widgets so open menus keep the instance active. */
export function setInstancePopoverOpen(instanceId: string, open: boolean) {
  ensureInstance(instanceId).setPopoverOpen(open)
}
