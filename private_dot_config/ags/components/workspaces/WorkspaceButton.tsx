import { run } from "../../lib/runtime"
import { workspaceClass, workspaceLabel } from "../../lib/bar-logic"
import type { HyprStateAccessor } from "../../lib/types"

type WorkspaceButtonProps = {
  base: number
  id: number
  hyprState: HyprStateAccessor
}

/**
 * Navigates to a workspace and reflects its active/visible/occupied state.
 */
export default function WorkspaceButton({ base, id, hyprState }: WorkspaceButtonProps) {
  return (
    <button
      class={hyprState((state) => workspaceClass(base, id, state))}
      onClicked={() => run(["hyprctl", "dispatch", "workspace", `${id}`])}
    >
      <label label={workspaceLabel(base, id)} />
    </button>
  )
}
