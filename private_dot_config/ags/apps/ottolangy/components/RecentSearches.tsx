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
      <For each={recentSearches}>
        {(entry) => (
          <centerbox class="ottolangy-recent-row" orientation={Gtk.Orientation.HORIZONTAL}>
            <button $type="start" class="ottolangy-recent-button" hexpand onClicked={() => onApplyRecentSearch(entry)}>
              <centerbox orientation={Gtk.Orientation.HORIZONTAL}>
                <box $type="start" orientation={Gtk.Orientation.VERTICAL} spacing={3} hexpand>
                  <box orientation={Gtk.Orientation.HORIZONTAL} spacing={8}>
                    <label label={entry.query} xalign={0} />
                    <label class="ottolangy-meta ottolangy-recent-mode" label={entry.mode ?? "translation"} xalign={0} />
                  </box>
                  <label class="ottolangy-meta" label={entry.summary ?? ""} xalign={0} />
                </box>
                <label $type="end" class="ottolangy-muted" label={formatLanguagePair(entry.fromLanguage, entry.toLanguage, languageLabels)} xalign={1} />
              </centerbox>
            </button>
            <box $type="end" orientation={Gtk.Orientation.HORIZONTAL} spacing={8}>
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
