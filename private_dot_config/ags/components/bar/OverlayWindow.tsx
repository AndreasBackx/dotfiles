import app from "ags/gtk4/app"
import { Astal, Gdk } from "ags/gtk4"

import type { BooleanAccessor } from "../../lib/types"

type OverlayWindowProps = {
  name: string
  namespace: string
  gdkmonitor: Gdk.Monitor
  visible: BooleanAccessor
  anchor: number
  marginTop?: number
  marginBottom?: number
  children: any
}

/**
 * Shared wrapper for AGS overlay windows used by bar surfaces.
 */
export default function OverlayWindow({
  name,
  namespace,
  gdkmonitor,
  visible,
  anchor,
  marginTop,
  marginBottom,
  children,
}: OverlayWindowProps) {
  const geometry = gdkmonitor.get_geometry()

  return (
    <window
      name={name}
      application={app}
      namespace={namespace}
      gdkmonitor={gdkmonitor}
      defaultWidth={geometry.width}
      visible={visible}
      exclusivity={Astal.Exclusivity.IGNORE}
      layer={Astal.Layer.OVERLAY}
      anchor={anchor}
      marginTop={marginTop}
      marginBottom={marginBottom}
    >
      {children}
    </window>
  )
}
