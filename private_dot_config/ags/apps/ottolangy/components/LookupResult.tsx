import Gtk from "gi://Gtk?version=4.0"

import { For } from "ags"

import type { StateAccessor } from "../../../common/utils/state"
import { formatLanguagePair } from "../utils/format"
import type { LookupResult } from "../utils/types"

import ConjugationSections from "./ConjugationSections"

type LookupResultProps = {
  status: StateAccessor<"idle" | "loading" | "ready" | "error">
  errorMessage: StateAccessor<string>
  result: StateAccessor<LookupResult | null>
  usedCache: StateAccessor<boolean>
  activeTab: StateAccessor<"translation" | "conjugation">
  copiedFormKey: StateAccessor<string>
  languageLabels: Map<string, string>
  onSetActiveTab: (tab: "translation" | "conjugation") => void
  onRefreshCurrentResult: () => void
  onRunReverseTranslationQuery: () => void
  onCopy: (text: string, key: string) => void
}

export default function LookupResult({
  status,
  errorMessage,
  result,
  usedCache,
  activeTab,
  copiedFormKey,
  languageLabels,
  onSetActiveTab,
  onRefreshCurrentResult,
  onRunReverseTranslationQuery,
  onCopy,
}: LookupResultProps) {
  return (
    <>
      <box visible={status((value) => value === "loading")}>
        <label class="ottolangy-muted" label="Looking up your query..." xalign={0} />
      </box>

      <box visible={status((value) => value === "error")} class="ottolangy-inline-message error">
        <label label={errorMessage} wrap xalign={0} />
      </box>

      <scrolledwindow class="ottolangy-results-scroll" vexpand visible={status((value) => value === "ready")}>
        <box orientation={Gtk.Orientation.VERTICAL} spacing={12}>
          <box visible={result((value) => Boolean(value))} orientation={Gtk.Orientation.VERTICAL} spacing={12}>
            <box class="ottolangy-summary" orientation={Gtk.Orientation.VERTICAL} spacing={6}>
              <centerbox orientation={Gtk.Orientation.HORIZONTAL}>
                <box $type="start" orientation={Gtk.Orientation.HORIZONTAL} spacing={10}>
                  <label class="ottolangy-term" label={result((value) => value?.summary.term ?? "")} xalign={0} />
                  <label class="ottolangy-meta ottolangy-pos" label={result((value) => value?.summary.partOfSpeech ?? "")} xalign={0} />
                </box>
                <box $type="end" orientation={Gtk.Orientation.HORIZONTAL} spacing={8}>
                  <label visible={usedCache} class="ottolangy-muted ottolangy-cached-label" label="cached" xalign={1} />
                  <button visible={usedCache} class="ottolangy-chip" onClicked={onRefreshCurrentResult}>
                    <label label="Refresh" />
                  </button>
                </box>
              </centerbox>
              <button
                class="ottolangy-translation-link"
                visible={result((value) => Boolean(value?.translation?.primary))}
                onClicked={onRunReverseTranslationQuery}
              >
                <label class="ottolangy-translation-line" label={result((value) => value?.summary.oneLineTranslation ?? "")} wrap xalign={0} />
              </button>
              <box orientation={Gtk.Orientation.HORIZONTAL} spacing={12}>
                <label visible={result((value) => Boolean(value?.summary.infinitive))} class="ottolangy-meta" label={result((value) => `infinitive: ${value?.summary.infinitive ?? ""}`)} xalign={0} />
                <label visible={result((value) => Boolean(value?.summary.gerund))} class="ottolangy-meta" label={result((value) => `gerund: ${value?.summary.gerund ?? ""}`)} xalign={0} />
                <label visible={result((value) => Boolean(value?.summary.participle))} class="ottolangy-meta" label={result((value) => `participle: ${value?.summary.participle ?? ""}`)} xalign={0} />
              </box>
            </box>

            <box class="ottolangy-tabs" orientation={Gtk.Orientation.HORIZONTAL} spacing={6}>
              <button
                class={activeTab((value) => (value === "translation" ? "ottolangy-tab active" : "ottolangy-tab"))}
                sensitive={result((value) => Boolean(value?.translation))}
                onClicked={() => onSetActiveTab("translation")}
              >
                <label label="Translation" />
              </button>
              <button
                class={activeTab((value) => (value === "conjugation" ? "ottolangy-tab active" : "ottolangy-tab"))}
                sensitive={result((value) => Boolean(value?.conjugation))}
                onClicked={() => onSetActiveTab("conjugation")}
              >
                <label label="Conjugation" />
              </button>
            </box>

            <box visible={activeTab((value) => value === "translation")} class="ottolangy-result-content" orientation={Gtk.Orientation.VERTICAL} spacing={10}>
              <label class="ottolangy-section-title" label="Translation" xalign={0} />
              <label class="ottolangy-meta-strong" label={result((value) => value?.translation?.primary ?? "Translation unavailable")} wrap xalign={0} />
              <box class="ottolangy-divider" />
              <label
                class="ottolangy-meta"
                label={result((value) => {
                  const translation = value?.translation
                  if (!translation) {
                    return "No translation backend response was available."
                  }

                  return `${translation.backend} • ${formatLanguagePair(translation.fromLanguage, translation.toLanguage, languageLabels)}`
                })}
                wrap
                xalign={0}
              />
              <label visible={result((value) => Boolean(value?.translation?.reverse))} class="ottolangy-meta" label={result((value) => `reverse check: ${value?.translation?.reverse ?? ""}`)} wrap xalign={0} />
              <label visible={result((value) => Boolean(value?.translation?.note))} class="ottolangy-meta" label={result((value) => value?.translation?.note ?? "")} wrap xalign={0} />
              <For each={result((value) => value?.summary.notes ?? [])}>
                {(note) => <label class="ottolangy-meta" label={note} wrap xalign={0} />}
              </For>
              <For each={result((value) => value?.warnings ?? [])}>
                {(warning) => <label class="ottolangy-inline-message" label={warning} wrap xalign={0} />}
              </For>
            </box>

            <box visible={activeTab((value) => value === "conjugation")} orientation={Gtk.Orientation.VERTICAL} spacing={10}>
              <For each={result((value) => value?.warnings ?? [])}>
                {(warning) => <label class="ottolangy-inline-message" label={warning} wrap xalign={0} />}
              </For>
              <ConjugationSections result={result} copiedFormKey={copiedFormKey} onCopy={onCopy} />
            </box>
          </box>
        </box>
      </scrolledwindow>
    </>
  )
}
