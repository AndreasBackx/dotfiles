import Gtk from "gi://Gtk?version=4.0"
import Gdk from "gi://Gdk?version=4.0"

import app from "ags/gtk4/app"
import { Astal } from "ags/gtk4"

type OttolangyWindowProps = {
  children: any
  onReady: (window: Gtk.Window) => void
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
      resizable
      visible
      keymode={Astal.Keymode.ON_DEMAND}
      $={(self: Gtk.Window) => {
        self.set_focusable(true)
        self.set_can_focus(true)
        self.set_can_target(true)
        self.set_focus_on_click(true)
        self.set_focus_visible(true)
        const keyController = new Gtk.EventControllerKey()
        keyController.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
        keyController.connect("key-pressed", (_, keyval) => {
          if (keyval === Gdk.KEY_Escape) {
            app.quit()
            return true
          }

          return false
        })
        self.add_controller(keyController)
        self.present()
        onReady(self)
      }}
    >
      {children}
    </window>
  )
}
