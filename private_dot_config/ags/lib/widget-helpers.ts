import { Gtk } from "ags/gtk4"

let updatePopoverVisibility: ((id: string, open: boolean) => void) | null = null
let updateHoverState: ((id: string, hovered: boolean) => void) | null = null
const trackedPopovers = new Map<string, Gtk.Popover>()

/**
 * Registers the app-level callback that receives popover open/closed events.
 */
export function setPopoverVisibilityReporter(callback: ((id: string, open: boolean) => void) | null) {
  updatePopoverVisibility = callback
}

/**
 * Registers the app-level callback that receives hover enter/leave events.
 */
export function setHoverReporter(callback: ((id: string, hovered: boolean) => void) | null) {
  updateHoverState = callback
}

/**
 * Clears the tracked hover state for a widget id when the widget disappears.
 */
function clearHoverState(id?: string) {
  if (id) {
    updateHoverState?.(id, false)
  }
}

/**
 * Attaches hover tracking to a widget and forwards optional enter/leave hooks.
 *
 * Example: `attachHoverHandlers(widget, "center-bar", showCenter, hideCenter)`
 */
export function attachHoverHandlers(widget: Gtk.Widget, id?: string, onEnter?: () => void, onLeave?: () => void) {
  const controller = new Gtk.EventControllerMotion()
  const reportEnter = () => {
    if (id) {
      updateHoverState?.(id, true)
    }

    onEnter?.()
  }
  const reportLeave = () => {
    clearHoverState(id)
    onLeave?.()
  }

  controller.connect("enter", reportEnter)
  controller.connect("leave", reportLeave)

  widget.connect("destroy", () => clearHoverState(id))
  widget.connect("unmap", () => clearHoverState(id))
  widget.connect("hide", () => clearHoverState(id))

  widget.add_controller(controller)
}

/**
 * Tracks a popover's open state and hover state under a stable id.
 *
 * Example: `attachPopoverHandlers(popover, "audio-popover-left-DP-1")`
 */
export function attachPopoverHandlers(popover: Gtk.Popover, id: string) {
  let open = popover.get_visible()
  trackedPopovers.set(id, popover)

  // Prefer a small set of stable signals here. Menubutton/popover pairs already
  // manage a lot of internal toggle state, and over-listening can trigger noisy
  // state churn during open/close transitions.
  const reportOpenState = (nextOpen: boolean) => {
    if (nextOpen === open) {
      return
    }

    open = nextOpen
    updatePopoverVisibility?.(id, nextOpen)
  }

  popover.connect("notify::visible", () => {
    reportOpenState(popover.get_visible())
  })

  popover.connect("closed", () => {
    reportOpenState(false)
  })

  popover.connect("destroy", () => {
    reportOpenState(false)
    trackedPopovers.delete(id)
  })
}

/**
 * Closes every tracked popover, which is used before hiding the center bar.
 */
export function closeTrackedPopovers() {
  for (const popover of trackedPopovers.values()) {
    popover.popdown()
  }
}
