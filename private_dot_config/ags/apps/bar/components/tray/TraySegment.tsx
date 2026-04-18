import Tray from "gi://AstalTray"

import { For, createBinding } from "ags"
import { Gtk } from "ags/gtk4"

import { setInstancePopoverOpen } from "../../utils/activity"
import { attachPopoverHandlers } from "../../utils/widget-helpers"
import { getTrayState } from "./TrayState"

type TraySegmentProps = {
  instanceId: string
}

function initTrayButton(button: Gtk.MenuButton, item: Tray.TrayItem, instanceId: string) {
  const popover = Gtk.PopoverMenu.new_from_model(item.menuModel)
  popover.set_autohide(true)
  popover.set_has_arrow(false)
  button.set_popover(popover)
  popover.insert_action_group("dbusmenu", item.actionGroup)
  attachPopoverHandlers(popover, `tray-popover-${item.itemId}`)
  popover.connect("notify::visible", () => {
    setInstancePopoverOpen(instanceId, popover.get_visible())
  })
  popover.connect("destroy", () => {
    setInstancePopoverOpen(instanceId, false)
  })

  item.connect("notify::action-group", () => {
    popover.insert_action_group("dbusmenu", item.actionGroup)
  })
}

/**
 * Renders StatusNotifier / AppIndicator items exposed through AstalTray.
 */
export default function TraySegment({ instanceId }: TraySegmentProps) {
  const { items } = getTrayState()

  return (
    <box class="tray-segment">
      <For each={items}>
        {(item) => (
          <menubutton
            class="bar-menu-button tray-button"
            tooltipText={createBinding(item, "tooltipText")}
            visible={createBinding(item, "status")((status) => status !== Tray.Status.PASSIVE)}
            $={(self: Gtk.MenuButton) => {
              self.set_focus_on_click(false)
              self.set_always_show_arrow(false)
              self.set_has_frame(false)
              initTrayButton(self, item, instanceId)
            }}
          >
            <box class="bar-item icon-only tray-item" halign={Gtk.Align.CENTER}>
              <image class="tray-icon" gicon={createBinding(item, "gicon")} pixelSize={16} />
            </box>
          </menubutton>
        )}
      </For>
    </box>
  )
}
