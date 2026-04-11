import { Gtk } from "ags/gtk4"

import { attachPopoverHandlers } from "../../lib/widget-helpers"

type SystemMenuButtonProps = {
  popoverId: string
  tooltipText?: any
  button: any
  children: any
}

export default function SystemMenuButton({ popoverId, tooltipText, button, children }: SystemMenuButtonProps) {
  return (
    <menubutton class="bar-menu-button" tooltipText={tooltipText}>
      {button}
      <popover $={(self: Gtk.Popover) => attachPopoverHandlers(self, popoverId)}>{children}</popover>
    </menubutton>
  )
}
