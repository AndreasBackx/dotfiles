import Gtk from "gi://Gtk?version=4.0"

import { For } from "ags"

import type { StateAccessor } from "../../../common/utils/state"
import { formatLanguagePair } from "../utils/format"
import type { RecentSearch } from "../utils/types"

type RecentSearchesProps = {
  status: StateAccessor<"idle" | "loading" | "ready" | "error">
  recentSearches: StateAccessor<RecentSearch[]>
  languageLabels: Map<string, string>
  onApplyRecentSearch: (entry: RecentSearch) => void
  onDeleteRecentSearch: (entry: RecentSearch) => void
  onClearRecentSearches: () => void
}

export default function RecentSearches({
  status,
  recentSearches,
  languageLabels,
  onApplyRecentSearch,
  onDeleteRecentSearch,
  onClearRecentSearches,
}: RecentSearchesProps) {
  return (
    <box visible={status((value) => value === "idle")} class="ottolangy-empty-state" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
      <centerbox orientation={Gtk.Orientation.HORIZONTAL}>
        <label $type="start" class="ottolangy-section-title" label="Recent searches" xalign={0} />
        <button $type="end" visible={recentSearches((entries) => entries.length > 0)} class="ottolangy-chip" onClicked={onClearRecentSearches}>
          <label label="Clear all" />
        </button>
      </centerbox>
      <For each={() => recentSearches.get()}>
        {(entry) => (
          <centerbox
            class="ottolangy-recent-row"
            orientation={Gtk.Orientation.HORIZONTAL}
            $={(self: Gtk.CenterBox) => {
              const controller = new Gtk.GestureClick()
              controller.connect("released", () => onApplyRecentSearch(entry))
              self.add_controller(controller)
            }}
          >
            <box $type="start" class="ottolangy-recent-button" orientation={Gtk.Orientation.VERTICAL} spacing={3} hexpand>
              <label label={entry.query} xalign={0} />
              <label class="ottolangy-meta" label={entry.summary ?? ""} xalign={0} />
            </box>
            <box $type="end" orientation={Gtk.Orientation.HORIZONTAL} spacing={8}>
              <label class="ottolangy-meta" label={entry.mode ?? "translation"} xalign={1} />
              <label class="ottolangy-muted" label={formatLanguagePair(entry.fromLanguage, entry.toLanguage, languageLabels)} xalign={1} />
              <button class="ottolangy-delete-button" onClicked={() => onDeleteRecentSearch(entry)}>
                <label label="🗑️" />
              </button>
            </box>
          </centerbox>
        )}
      </For>
      <label visible={recentSearches((entries) => entries.length === 0)} class="ottolangy-muted" label="No recent searches yet." xalign={0} />
    </box>
  )
}
