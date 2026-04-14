import { For } from "ags"

import { workspaceIdsForBase } from "../../utils/bar-logic"
import type { HyprStateAccessor } from "../../utils/types"

import WorkspaceButton from "./WorkspaceButton"

type WorkspaceStripProps = {
  base: number
  hyprState: HyprStateAccessor
}

/**
 * Renders the currently relevant workspaces for one role-local workspace range.
 */
export default function WorkspaceStrip({ base, hyprState }: WorkspaceStripProps) {
  return (
    <box class="workspace-strip">
      <For each={hyprState((state) => workspaceIdsForBase(base, state))}>
        {(id) => <WorkspaceButton base={base} id={id} hyprState={hyprState} />}
      </For>
    </box>
  )
}
