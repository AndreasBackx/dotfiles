import Gtk from "gi://Gtk?version=4.0"

import { For } from "ags"

import type { StateAccessor } from "../../../common/utils/state"
import { chunkColumns } from "../utils/format"
import type { LookupResult } from "../utils/types"

import ConjugationCellRow from "./ConjugationCellRow"

type ConjugationSectionsProps = {
  result: StateAccessor<LookupResult | null>
  copiedFormKey: StateAccessor<string>
  onCopy: (text: string, key: string) => void
}

export default function ConjugationSections({ result, copiedFormKey, onCopy }: ConjugationSectionsProps) {
  return (
    <box class="ottolangy-conjugation-body ottolangy-result-content" orientation={Gtk.Orientation.VERTICAL} spacing={16}>
      <For each={result((value) => value?.conjugation?.sections ?? [])}>
        {(section) => (
          <box class="ottolangy-section" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
            <label class="ottolangy-section-label" label={section.title.toUpperCase()} xalign={0} />
            <For each={() => chunkColumns(section.columns, 4)}>
              {(columnRow) => (
                <box class="ottolangy-columns" orientation={Gtk.Orientation.HORIZONTAL} spacing={8}>
                  <box class="ottolangy-pronoun-column" orientation={Gtk.Orientation.VERTICAL} spacing={0}>
                    <label class="ottolangy-column-title ottolangy-column-title-muted" label="" xalign={0} />
                    <For each={() => section.pronouns}>
                      {(pronoun) => (
                        <box class="ottolangy-row" orientation={Gtk.Orientation.HORIZONTAL}>
                          <box class="ottolangy-row-content" orientation={Gtk.Orientation.HORIZONTAL}>
                            <label class="ottolangy-pronoun" label={pronoun.label} xalign={0} />
                          </box>
                        </box>
                      )}
                    </For>
                  </box>
                  <box
                    class="ottolangy-column-group"
                    orientation={Gtk.Orientation.HORIZONTAL}
                    spacing={8}
                    homogeneous={columnRow.length !== 1}
                    hexpand
                  >
                    <For each={() => columnRow}>
                      {(column) => (
                        <box class="ottolangy-column" orientation={Gtk.Orientation.VERTICAL} spacing={0} hexpand>
                          <label class="ottolangy-column-title" label={column.title} xalign={0} />
                          <For each={() => section.pronouns}>
                            {(pronoun) => {
                              const cell = column.values[pronoun.key]
                              const copyKey = `${section.key}:${column.key}:${pronoun.key}`

                              return (
                                <ConjugationCellRow cell={cell} copyKey={copyKey} copiedFormKey={copiedFormKey} onCopy={onCopy} />
                              )
                            }}
                          </For>
                        </box>
                      )}
                    </For>
                    <For each={() => Array.from({ length: columnRow.length === 3 ? 1 : 0 }, (_, index) => index)}>
                      {(index) => <box class="ottolangy-column ottolangy-column-placeholder" hexpand />}
                    </For>
                  </box>
                </box>
              )}
            </For>
          </box>
        )}
      </For>
    </box>
  )
}
