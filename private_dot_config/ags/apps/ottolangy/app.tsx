import Gtk from "gi://Gtk?version=4.0"

import app from "ags/gtk4/app"
import { Astal } from "ags/gtk4"
import { For, createState } from "ags"
import { execAsync } from "ags/process"
import { timeout } from "ags/time"

import appCss from "./app.css"
import {
  clearAllRecentSearchCaches,
  deleteRecentSearchCache,
  loadLanguageOptions,
  loadRecentSearches,
  lookup,
  normalizeQuery,
  persistRecentSearches,
  pushRecentSearch,
} from "./lib/client"
import type { LookupResult, LookupSettings, RecentSearch } from "./lib/types"

const css = appCss

function shellQuote(text: string) {
  return `'${text.replace(/'/g, `'"'"'`)}'`
}

async function copyToClipboard(text: string) {
  await execAsync(["bash", "-lc", `printf %s ${shellQuote(text)} | wl-copy`])
}

function formatLanguagePair(fromLanguage: string, toLanguage: string, labels: Map<string, string>) {
  return `${labels.get(fromLanguage) ?? fromLanguage.toUpperCase()} -> ${labels.get(toLanguage) ?? toLanguage.toUpperCase()}`
}

function chunkColumns<T>(items: T[], columnsPerRow = 4) {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += columnsPerRow) {
    chunks.push(items.slice(index, index + columnsPerRow))
  }
  return chunks
}

app.start({
  instanceName: "ottolangy",
  css,
  gtkTheme: "Adwaita-dark",
  main() {
    const languageOptions = loadLanguageOptions()
    const languageLabels = new Map(languageOptions.map((option) => [option.code, option.label]))
    const initialRecentSearches = loadRecentSearches()
    persistRecentSearches(initialRecentSearches)

    const [query, setQuery] = createState("")
    const [fromLanguage, setFromLanguage] = createState("es")
    const [toLanguage, setToLanguage] = createState("en")
    const [result, setResult] = createState<LookupResult | null>(null)
    const [status, setStatus] = createState<"idle" | "loading" | "ready" | "error">("idle")
    const [errorMessage, setErrorMessage] = createState("")
    const [activeTab, setActiveTab] = createState<"translation" | "conjugation">("translation")
    const [copiedFormKey, setCopiedFormKey] = createState("")
    const [usedCache, setUsedCache] = createState(false)
    const [settings, setSettings] = createState<LookupSettings>({ includeVosotros: false })
    const [recentSearches, setRecentSearches] = createState<RecentSearch[]>(initialRecentSearches)

    let searchEntry: Gtk.Entry | null = null
    const focusSearchEntry = () => {
      if (!searchEntry) {
        return
      }

      searchEntry.grab_focus()
      searchEntry.set_position(-1)
    }

    const runLookup = async (
      nextQuery?: string,
      nextFromLanguage?: string,
      nextToLanguage?: string,
      options: { forceRefresh?: boolean } = {},
    ) => {
      const lookupQuery = normalizeQuery(nextQuery ?? query.get())
      const lookupFromLanguage = nextFromLanguage ?? fromLanguage.get()
      const lookupToLanguage = nextToLanguage ?? toLanguage.get()

      if (!lookupQuery) {
        setStatus("error")
        setErrorMessage("Type a word or phrase to look up.")
        return
      }

      setStatus("loading")
      setErrorMessage("")

      try {
        const response = await lookup(lookupQuery, lookupFromLanguage, lookupToLanguage, settings.get(), options)
        setResult(response.result)
        setUsedCache(response.cached)
        setStatus("ready")
        setActiveTab(response.result.defaultTab)
        setQuery(lookupQuery)

        const nextRecentSearches = pushRecentSearch(recentSearches.get(), {
          query: lookupQuery,
          fromLanguage: lookupFromLanguage,
          toLanguage: lookupToLanguage,
          summary: response.result.summary.oneLineTranslation,
          mode: response.result.mode,
        })
        setRecentSearches(nextRecentSearches)
        persistRecentSearches(nextRecentSearches)
      } catch (error) {
        setResult(null)
        setUsedCache(false)
        setStatus("error")
        setErrorMessage(String(error))
      }
    }

    const applyRecentSearch = (entry: RecentSearch) => {
      setQuery(entry.query)
      setFromLanguage(entry.fromLanguage)
      setToLanguage(entry.toLanguage)
      runLookup(entry.query, entry.fromLanguage, entry.toLanguage)
    }

    const deleteRecentSearch = (entry: RecentSearch) => {
      const nextRecentSearches = recentSearches
        .get()
        .filter(
          (item) =>
            item.query !== entry.query || item.fromLanguage !== entry.fromLanguage || item.toLanguage !== entry.toLanguage,
        )
      deleteRecentSearchCache(entry, settings.get())
      setRecentSearches(nextRecentSearches)
      persistRecentSearches(nextRecentSearches)
    }

    const clearRecentSearches = () => {
      clearAllRecentSearchCaches()
      setRecentSearches([])
      persistRecentSearches([])
    }

    const refreshCurrentResult = () => runLookup(undefined, undefined, undefined, { forceRefresh: true })

    const updateLanguages = (kind: "from" | "to", nextLanguage: string) => {
      const currentFrom = fromLanguage.get()
      const currentTo = toLanguage.get()
      let nextFrom = currentFrom
      let nextTo = currentTo

      if (kind === "from") {
        nextFrom = nextLanguage
        if (nextLanguage === currentTo && currentFrom !== currentTo) {
          nextTo = currentFrom
        }
      } else {
        nextTo = nextLanguage
        if (nextLanguage === currentFrom && currentFrom !== currentTo) {
          nextFrom = currentTo
        }
      }

      setFromLanguage(nextFrom)
      setToLanguage(nextTo)
    }

    const setFromLanguageWithSwap = (nextLanguage: string) => {
      updateLanguages("from", nextLanguage)
    }

    const setToLanguageWithSwap = (nextLanguage: string) => {
      updateLanguages("to", nextLanguage)
    }

    const runReverseTranslationQuery = () => {
      const currentResult = result.get()
      const translation = currentResult?.translation?.primary?.trim()
      if (!translation) {
        return
      }

      const nextFromLanguage = toLanguage.get()
      const nextToLanguage = fromLanguage.get()
      const normalizedTranslation = normalizeQuery(translation)
      setQuery(normalizedTranslation)
      setFromLanguage(nextFromLanguage)
      setToLanguage(nextToLanguage)
      runLookup(normalizedTranslation, nextFromLanguage, nextToLanguage)
    }

    const handleCopy = async (text: string, key: string) => {
      try {
        await copyToClipboard(text)
        setCopiedFormKey(key)
        timeout(1200, () => {
          setCopiedFormKey("")
        })
      } catch (error) {
        console.error(error)
      }
    }

    return (
      <window
        name="ottolangy-window"
        application={app}
        title="Ottolangy"
        defaultWidth={1040}
        defaultHeight={760}
        class="ottolangy-window"
        decorated
        deletable
        focusable
        canFocus
        canTarget
        focusOnClick
        layer={Astal.Layer.TOP}
        exclusivity={Astal.Exclusivity.NORMAL}
        keymode={Astal.Keymode.EXCLUSIVE}
        resizable
        visible
        $={(self: Gtk.Window) => {
          const controller = new Gtk.ShortcutController()
          controller.set_scope(Gtk.ShortcutScope.GLOBAL)
          controller.add_shortcut(
            Gtk.Shortcut.new(
              Gtk.ShortcutTrigger.parse_string("Escape"),
              Gtk.CallbackAction.new(() => {
                app.quit()
                return true
              }),
            ),
          )
          self.add_controller(controller)
          self.present()
          timeout(120, () => focusSearchEntry())
        }}
      >
        <box class="ottolangy-shell" orientation={Gtk.Orientation.VERTICAL} spacing={14}>
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
                    onClicked={() => setSettings({ includeVosotros: !settings.get().includeVosotros })}
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
                        onClicked={() => setFromLanguageWithSwap(option.code)}
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
                        onClicked={() => setToLanguageWithSwap(option.code)}
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
                  searchEntry = self
                  timeout(20, () => focusSearchEntry())
                  self.connect("changed", () => setQuery(self.get_text()))
                  self.connect("activate", () => runLookup())
                }}
              />
              <button class="ottolangy-action primary" onClicked={() => runLookup()}>
                <label label="Translate or conjugate" />
              </button>
            </box>
          </box>

          <box visible={status((value) => value === "loading")}>
            <label class="ottolangy-muted" label="Looking up your query..." xalign={0} />
          </box>

          <box visible={status((value) => value === "error")} class="ottolangy-inline-message error">
            <label label={errorMessage} wrap xalign={0} />
          </box>

          <scrolledwindow class="ottolangy-results-scroll" vexpand visible={status((value) => value === "ready" || value === "idle")}>
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
                      <button visible={usedCache} class="ottolangy-chip" onClicked={refreshCurrentResult}>
                        <label label="Refresh" />
                      </button>
                    </box>
                  </centerbox>
                  <button
                    class="ottolangy-translation-link"
                    visible={result((value) => Boolean(value?.translation?.primary))}
                    onClicked={runReverseTranslationQuery}
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
                    onClicked={() => setActiveTab("translation")}
                  >
                    <label label="Translation" />
                  </button>
                  <button
                    class={activeTab((value) => (value === "conjugation" ? "ottolangy-tab active" : "ottolangy-tab"))}
                    sensitive={result((value) => Boolean(value?.conjugation))}
                    onClicked={() => setActiveTab("conjugation")}
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
                  <box class="ottolangy-conjugation-body ottolangy-result-content" orientation={Gtk.Orientation.VERTICAL} spacing={16}>
                    <For each={result((value) => value?.conjugation?.sections ?? [])}>
                      {(section) => (
                        <box class="ottolangy-section" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
                          <label class="ottolangy-section-label" label={section.title.toUpperCase()} xalign={0} />
                          <For each={() => chunkColumns(section.columns, 4)}>
                            {(columnRow) => (
                              // Each row reserves four tense slots so section columns line up
                              // vertically across moods, even when a row has fewer tenses.
                              <box class="ottolangy-columns" orientation={Gtk.Orientation.HORIZONTAL} spacing={8}>
                                <box class="ottolangy-pronoun-column" orientation={Gtk.Orientation.VERTICAL} spacing={0}>
                                  <label class="ottolangy-column-title ottolangy-column-title-muted" label="" xalign={0} />
                                  <For each={() => section.pronouns}>
                                    {(pronoun) => (
                                      <box class="ottolangy-row" orientation={Gtk.Orientation.HORIZONTAL}>
                                        <label class="ottolangy-pronoun" label={pronoun.label} xalign={0} />
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
                                              <box
                                                class="ottolangy-row ottolangy-copy-row"
                                                orientation={Gtk.Orientation.HORIZONTAL}
                                                spacing={6}
                                                $={(self: Gtk.Box) => {
                                                  const controller = new Gtk.GestureClick()
                                                  controller.connect("released", () => {
                                                    if (cell?.text) {
                                                      handleCopy(cell.text, copyKey)
                                                    }
                                                  })
                                                  self.add_controller(controller)
                                                }}
                                              >
                                              <label class="ottolangy-form ottolangy-copyable" label={cell?.markup ?? ""} useMarkup wrap xalign={0} hexpand />
                                              <label
                                                visible={copiedFormKey((value) => value === copyKey)}
                                                class="ottolangy-copied-indicator"
                                                  label="✓"
                                                  xalign={1}
                                                />
                                              </box>
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
                </box>
              </box>

              <box visible={status((value) => value === "idle")} class="ottolangy-empty-state" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
                <centerbox orientation={Gtk.Orientation.HORIZONTAL}>
                  <label $type="start" class="ottolangy-section-title" label="Recent searches" xalign={0} />
                  <button $type="end" visible={recentSearches((entries) => entries.length > 0)} class="ottolangy-chip" onClicked={clearRecentSearches}>
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
                        controller.connect("released", () => applyRecentSearch(entry))
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
                        <button class="ottolangy-delete-button" onClicked={() => deleteRecentSearch(entry)}>
                          <label label="🗑️" />
                        </button>
                      </box>
                    </centerbox>
                  )}
                </For>
                <label visible={recentSearches((entries) => entries.length === 0)} class="ottolangy-muted" label="No recent searches yet." xalign={0} />
              </box>
            </box>
          </scrolledwindow>
        </box>
      </window>
    )
  },
})
