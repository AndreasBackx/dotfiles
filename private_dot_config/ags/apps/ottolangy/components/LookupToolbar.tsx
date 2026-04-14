import Gtk from "gi://Gtk?version=4.0"

import { timeout } from "ags/time"

import type { StateAccessor } from "../../../common/utils/state"
import type { LookupSettings } from "../utils/types"

type LookupToolbarProps = {
  query: StateAccessor<string>
  settings: StateAccessor<LookupSettings>
  onSetSettings: (settings: LookupSettings) => void
  onLookup: () => void
  onSearchEntryReady: (entry: Gtk.Entry) => void
  onClearSearch: () => void
  onFromDropdownHostReady: (host: Gtk.Box) => void
  onToDropdownHostReady: (host: Gtk.Box) => void
}

export default function LookupToolbar({
  query,
  settings,
  onSetSettings,
  onLookup,
  onSearchEntryReady,
  onClearSearch,
  onFromDropdownHostReady,
  onToDropdownHostReady,
}: LookupToolbarProps) {
  return (
    <>
      <centerbox class="ottolangy-topbar" orientation={Gtk.Orientation.HORIZONTAL}>
        <box $type="start" orientation={Gtk.Orientation.VERTICAL} spacing={2}>
          <label class="ottolangy-title" label="Ottolangy" xalign={0} />
          <label class="ottolangy-subtitle" label="Local-first tasty translations and conjugations!" xalign={0} />
        </box>
        <menubutton $type="end" class="ottolangy-icon-button">
          <label label="Settings" />
          <popover class="ottolangy-popover">
            <box orientation={Gtk.Orientation.VERTICAL} spacing={8} marginTop={6} marginBottom={6} marginStart={6} marginEnd={6}>
              <label class="ottolangy-section-title" label="Conjugation" xalign={0} />
              <button
                class={settings((value) => (value.includeVosotros ? "ottolangy-setting-toggle active" : "ottolangy-setting-toggle"))}
                onClicked={() => onSetSettings({ includeVosotros: !settings.get().includeVosotros })}
              >
                <label label={settings((value) => `Include vosotros ${value.includeVosotros ? "on" : "off"}`)} xalign={0} />
              </button>
            </box>
          </popover>
        </menubutton>
      </centerbox>

      <box class="ottolangy-toolbar" orientation={Gtk.Orientation.VERTICAL} spacing={10}>
        <centerbox orientation={Gtk.Orientation.HORIZONTAL}>
          <box $type="start" class="ottolangy-language-row" orientation={Gtk.Orientation.HORIZONTAL} spacing={12}>
            <box class="ottolangy-language-group" orientation={Gtk.Orientation.HORIZONTAL} spacing={6}>
              <label class="ottolangy-meta ottolangy-language-label" label="From:" xalign={0} />
              <box class="ottolangy-language-dropdown" $={onFromDropdownHostReady} />
            </box>
            <box class="ottolangy-language-group" orientation={Gtk.Orientation.HORIZONTAL} spacing={6}>
              <label class="ottolangy-meta ottolangy-language-label" label="To:" xalign={0} />
              <box class="ottolangy-language-dropdown" $={onToDropdownHostReady} />
            </box>
          </box>
          <label
            $type="end"
            class="ottolangy-toolbar-note"
            label="Type a Spanish infinitive for full conjugation, or switch direction and use it as a translator."
            justify={Gtk.Justification.RIGHT}
            singleLineMode
            xalign={1}
          />
        </centerbox>

        <box orientation={Gtk.Orientation.HORIZONTAL} spacing={8}>
          <box class="ottolangy-search-box" hexpand>
            <entry
              hexpand
              class="ottolangy-entry"
              placeholderText="Buscar verbo o palabra..."
              text={query}
              $={(self: Gtk.Entry) => {
                onSearchEntryReady(self)
                timeout(20, () => {
                  self.grab_focus()
                  self.set_position(-1)
                })
              }}
            />
            <button class="ottolangy-search-clear" visible={query((value) => value.length > 0)} onClicked={onClearSearch}>
              <label label="X" />
            </button>
          </box>
          <button class="ottolangy-action primary" onClicked={onLookup}>
            <label label="Translate or conjugate" />
          </button>
        </box>
      </box>
    </>
  )
}
