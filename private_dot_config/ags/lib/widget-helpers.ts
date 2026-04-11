import { Gtk } from "ags/gtk4"

let reportPointerActivity: (() => void) | null = null
let updatePopoverVisibility: ((open: boolean) => void) | null = null

export function setPointerActivityReporter(callback: (() => void) | null) {
  reportPointerActivity = callback
}

export function setPopoverVisibilityReporter(callback: ((open: boolean) => void) | null) {
  updatePopoverVisibility = callback
}

export function attachHoverHandlers(widget: Gtk.Widget, onEnter?: () => void, onLeave?: () => void) {
  const controller = new Gtk.EventControllerMotion()

  if (onEnter) {
    controller.connect("enter", () => {
      reportPointerActivity?.()
      onEnter()
    })
  }

  controller.connect("motion", () => reportPointerActivity?.())

  if (onLeave) {
    controller.connect("leave", () => onLeave())
  }

  widget.add_controller(controller)
}

export function attachPopoverHandlers(popover: Gtk.Popover) {
  let visible = popover.get_visible()

  popover.connect("notify::visible", () => {
    const nextVisible = popover.get_visible()

    if (nextVisible === visible) {
      return
    }

    visible = nextVisible
    updatePopoverVisibility?.(nextVisible)
  })

  popover.connect("closed", () => {
    if (!visible) {
      return
    }

    visible = false
    updatePopoverVisibility?.(false)
  })
}
