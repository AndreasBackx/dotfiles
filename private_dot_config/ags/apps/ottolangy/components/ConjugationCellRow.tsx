import Gtk from "gi://Gtk?version=4.0"

import type { StateAccessor } from "../../../common/utils/state"
import type { ConjugationCell } from "../utils/types"

type ConjugationCellRowProps = {
  cell: ConjugationCell | undefined
  copyKey: string
  copiedFormKey: StateAccessor<string>
  onCopy: (text: string, key: string) => void
}

export default function ConjugationCellRow({ cell, copyKey, copiedFormKey, onCopy }: ConjugationCellRowProps) {
  return (
    <button
      class="ottolangy-row ottolangy-copy-row"
      canFocus={Boolean(cell?.text)}
      focusOnClick={Boolean(cell?.text)}
      sensitive={Boolean(cell?.text)}
      onClicked={() => {
        if (cell?.text) {
          onCopy(cell.text, copyKey)
        }
      }}
    >
      <box class="ottolangy-row-content" orientation={Gtk.Orientation.HORIZONTAL} spacing={6} hexpand>
        <label class="ottolangy-form ottolangy-copyable" label={cell?.markup ?? ""} useMarkup wrap xalign={0} hexpand />
        <label visible={copiedFormKey((value) => value === copyKey)} class="ottolangy-copied-indicator" label="✓" xalign={1} />
      </box>
    </button>
  )
}
