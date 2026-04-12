import { Gtk } from "ags/gtk4"

import { attachPopoverHandlers } from "../../lib/widget-helpers"

type SystemMenuButtonProps = {
  popoverId: string
  tooltipText?: any
  button: any
  children: any
}

/**
 * Shared menubutton wrapper that wires a tracked popover to a system widget.
 */
export default function SystemMenuButton({
  popoverId,
  tooltipText,
  button,
  children,
}: SystemMenuButtonProps) {
  let menuButton: Gtk.MenuButton | null = null
  let popover: Gtk.Popover | null = null
  let wired = false

  const wirePopover = () => {
    if (!menuButton || !popover || wired) {
      return
    }

    wired = true
    menuButton.set_popover(popover)
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
      <popover
        $={(self: Gtk.Popover) => {
          popover = self
          self.set_autohide(true)
          self.set_has_arrow(false)
          wirePopover()
        }}
      >
        {children}
      </popover>
    </menubutton>
  )
}
