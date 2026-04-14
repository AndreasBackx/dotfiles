import Gtk from "gi://Gtk?version=4.0"

import app from "ags/gtk4/app"
import { Astal } from "ags/gtk4"

type OttolangyWindowProps = {
  children: any
  onReady: () => void
}

export default function OttolangyWindow({ children, onReady }: OttolangyWindowProps) {
  return (
    <window
      name="ottolangy-window"
      application={app}
      title="Ottolangy"
      defaultWidth={1040}
      defaultHeight={760}
      class="ottolangy-window"
      decorated
      deletable
      focusable
      canFocus
      canTarget
      focusOnClick
      layer={Astal.Layer.TOP}
      exclusivity={Astal.Exclusivity.NORMAL}
      keymode={Astal.Keymode.EXCLUSIVE}
      resizable
      visible
      $={(self: Gtk.Window) => {
        const controller = new Gtk.ShortcutController()
        controller.set_scope(Gtk.ShortcutScope.GLOBAL)
        controller.add_shortcut(
          Gtk.Shortcut.new(
            Gtk.ShortcutTrigger.parse_string("Escape"),
            Gtk.CallbackAction.new(() => {
              app.quit()
              return true
            }),
          ),
        )
        self.add_controller(controller)
        self.present()
        onReady()
      }}
    >
      {children}
    </window>
  )
}
