import Gtk from "gi://Gtk?version=4.0"

import { For } from "ags"
import { timeout } from "ags/time"

import type { StateAccessor } from "../../../common/utils/state"
import type { LanguageOption, LookupSettings } from "../utils/types"

type LookupToolbarProps = {
  languageOptions: LanguageOption[]
  fromLanguage: StateAccessor<string>
  toLanguage: StateAccessor<string>
  query: StateAccessor<string>
  settings: StateAccessor<LookupSettings>
  onSetFromLanguage: (language: string) => void
  onSetToLanguage: (language: string) => void
  onSetSettings: (settings: LookupSettings) => void
  onLookup: () => void
  onSearchEntryReady: (entry: Gtk.Entry) => void
}

export default function LookupToolbar({
  languageOptions,
  fromLanguage,
  toLanguage,
  query,
  settings,
  onSetFromLanguage,
  onSetToLanguage,
  onSetSettings,
  onLookup,
  onSearchEntryReady,
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
              <For each={() => languageOptions}>
                {(option) => (
                  <button
                    class={fromLanguage((value) => (value === option.code ? "ottolangy-lang-item active" : "ottolangy-lang-item"))}
                    onClicked={() => onSetFromLanguage(option.code)}
                  >
                    <label label={option.label} />
                  </button>
                )}
              </For>
            </box>
            <box class="ottolangy-language-group" orientation={Gtk.Orientation.HORIZONTAL} spacing={6}>
              <label class="ottolangy-meta ottolangy-language-label" label="To:" xalign={0} />
              <For each={() => languageOptions}>
                {(option) => (
                  <button
                    class={toLanguage((value) => (value === option.code ? "ottolangy-lang-item active" : "ottolangy-lang-item"))}
                    onClicked={() => onSetToLanguage(option.code)}
                  >
                    <label label={option.label} />
                  </button>
                )}
              </For>
            </box>
          </box>
          <label
            $type="end"
            class="ottolangy-toolbar-note"
            label="Type a Spanish infinitive for full conjugation, or switch direction and use it as a translator."
            wrap
            justify={Gtk.Justification.RIGHT}
            xalign={1}
          />
        </centerbox>

        <box orientation={Gtk.Orientation.HORIZONTAL} spacing={8}>
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
          <button class="ottolangy-action primary" onClicked={onLookup}>
            <label label="Translate or conjugate" />
          </button>
        </box>
      </box>
    </>
  )
}
