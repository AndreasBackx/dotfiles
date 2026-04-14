import Hyprland from "gi://AstalHyprland"

import { workspaceClass, workspaceLabel } from "../../utils/bar-logic"
import type { HyprStateAccessor } from "../../utils/types"

type WorkspaceButtonProps = {
  base: number
  id: number
  hyprState: HyprStateAccessor
}

/**
 * Navigates to a workspace and reflects its active/visible/occupied state.
 */
export default function WorkspaceButton({ base, id, hyprState }: WorkspaceButtonProps) {
  const hyprland = Hyprland.get_default()

  return (
    <button
      class={hyprState((state) => workspaceClass(base, id, state))}
      onClicked={() => hyprland?.dispatch("workspace", `${id}`)}
    >
      <label label={workspaceLabel(base, id)} />
    </button>
  )
}
