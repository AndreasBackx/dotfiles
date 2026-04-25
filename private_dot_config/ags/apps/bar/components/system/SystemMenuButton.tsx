import { Gdk, Gtk } from "ags/gtk4"

import { setInstancePopoverOpen } from "../../utils/activity"
import { attachPopoverHandlers } from "../../utils/widget-helpers"

type SystemMenuButtonProps = {
  popoverId?: string
  instanceId?: string
  tooltipText?: any
  button: any
  children?: any
}

/**
 * Shared menubutton wrapper that wires a tracked popover to a system widget.
 */
export default function SystemMenuButton({
  popoverId,
  instanceId,
  tooltipText,
  button,
  children,
}: SystemMenuButtonProps) {
  let menuButton: Gtk.MenuButton | null = null
  let popover: Gtk.Popover | null = null
  let wired = false
  const hasPopover = Boolean(popoverId && children)

  const wirePopover = () => {
    if (!hasPopover || !menuButton || !popover || wired) {
      return
    }

    wired = true
    menuButton.set_popover(popover)
    const clickController = new Gtk.GestureClick()
    clickController.set_button(Gdk.BUTTON_PRIMARY)
    clickController.connect("pressed", (controller) => {
      if (!popover?.get_visible()) {
        return
      }

      controller.set_state(Gtk.EventSequenceState.CLAIMED)
      popover.popdown()
    })
    menuButton.add_controller(clickController)
    attachPopoverHandlers(popover, popoverId)
  }

  return (
    <menubutton
      class="bar-menu-button"
      tooltipText={tooltipText}
      $={(self: Gtk.MenuButton) => {
        menuButton = self
        self.set_focus_on_click(false)
        self.set_always_show_arrow(false)
        self.set_has_frame(false)
        wirePopover()
      }}
    >
      {button}
      {hasPopover ? (
        <popover
          $={(self: Gtk.Popover) => {
            popover = self
            self.set_autohide(true)
            self.set_has_arrow(false)
            if (instanceId) {
              // Keep the owning bar instance marked as active while any system
              // popover is open. This lets upcoming adaptive pollers keep their
              // data fresh for interactive widgets even if the surrounding bar is
              // otherwise hidden or auto-hidden.
              self.connect("notify::visible", () => {
                setInstancePopoverOpen(instanceId, self.get_visible())
              })
              self.connect("destroy", () => {
                setInstancePopoverOpen(instanceId, false)
              })
            }
            wirePopover()
          }}
        >
          {children}
        </popover>
      ) : null}
    </menubutton>
  )
}
