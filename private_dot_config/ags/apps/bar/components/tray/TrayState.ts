import Tray from "gi://AstalTray"

import { createBinding } from "ags"

import { getGlobalState } from "../../utils/global-state"

/**
 * Returns the shared tray item list for all tray segments.
 */
export function getTrayState() {
  return getGlobalState("bar-tray-state", () => {
    const tray = Tray.get_default()
    return {
      items: createBinding(tray, "items"),
    }
  })
}
