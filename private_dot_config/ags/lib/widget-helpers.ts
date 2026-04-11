import { Gtk } from "ags/gtk4"

let updatePopoverVisibility: ((id: string, open: boolean) => void) | null = null
let updateHoverState: ((id: string, hovered: boolean) => void) | null = null
const trackedPopovers = new Map<string, Gtk.Popover>()

export function setPopoverVisibilityReporter(callback: ((id: string, open: boolean) => void) | null) {
  updatePopoverVisibility = callback
}

export function setHoverReporter(callback: ((id: string, hovered: boolean) => void) | null) {
  updateHoverState = callback
}

function clearHoverState(id?: string) {
  if (id) {
    updateHoverState?.(id, false)
  }
}

// Hover handlers are attached to both bar windows and popovers so the app-level
// visibility controller can treat them as a single interactive surface.
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

export function attachPopoverHandlers(popover: Gtk.Popover, id: string) {
  let open = popover.get_visible()
  trackedPopovers.set(id, popover)
  attachHoverHandlers(popover, id)

  // Gtk emits multiple visibility-related signals while a popover opens and
  // closes. Collapse them to a single stable open/closed callback.
  const reportOpenState = (nextOpen: boolean) => {
    if (nextOpen === open) {
      return
    }

    open = nextOpen
    updatePopoverVisibility?.(id, nextOpen)
  }

  popover.connect("show", () => reportOpenState(true))
  popover.connect("map", () => reportOpenState(true))
  popover.connect("hide", () => reportOpenState(false))
  popover.connect("unmap", () => reportOpenState(false))
  popover.connect("destroy", () => {
    reportOpenState(false)
    trackedPopovers.delete(id)
  })

  popover.connect("notify::visible", () => {
    reportOpenState(popover.get_visible())
  })

  popover.connect("closed", () => {
    reportOpenState(false)
  })
}

export function closeTrackedPopovers() {
  for (const popover of trackedPopovers.values()) {
    popover.popdown()
  }
}
