import app from "ags/gtk4/app"
import { Astal, Gdk } from "ags/gtk4"

import type { BooleanAccessor } from "../../utils/types"

type OverlayWindowProps = {
  name: string
  namespace: string
  gdkmonitor: Gdk.Monitor
  visible: BooleanAccessor
  anchor: number
  exclusivity?: Astal.Exclusivity
  layer?: Astal.Layer
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
  exclusivity = Astal.Exclusivity.IGNORE,
  layer = Astal.Layer.OVERLAY,
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
      exclusivity={exclusivity}
      layer={layer}
      anchor={anchor}
      marginTop={marginTop}
      marginBottom={marginBottom}
    >
      {children}
    </window>
  )
}
