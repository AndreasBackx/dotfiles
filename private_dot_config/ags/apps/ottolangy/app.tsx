import Gtk from "gi://Gtk?version=4.0"

import app from "ags/gtk4/app"
import { createState } from "ags"
import { timeout } from "ags/time"

import commonBaseCss from "../../common/theming/base.css"
import lookupResultCss from "./components/LookupResult.css"
import lookupToolbarCss from "./components/LookupToolbar.css"
import recentSearchesCss from "./components/RecentSearches.css"
import LookupResultView from "./components/LookupResult"
import LookupToolbar from "./components/LookupToolbar"
import OttolangyWindow from "./components/OttolangyWindow"
import RecentSearches from "./components/RecentSearches"
import windowCss from "./theming/window.css"
import {
  clearAllRecentSearchCaches,
  deleteRecentSearchCache,
  loadLanguageOptions,
  loadRecentSearches,
  lookup,
  normalizeQuery,
  persistRecentSearches,
  pushRecentSearch,
} from "./utils/client"
import { copyToClipboard } from "./utils/clipboard"
import type { LookupResult, LookupSettings, RecentSearch } from "./utils/types"

const css = [commonBaseCss, windowCss, lookupToolbarCss, lookupResultCss, recentSearchesCss].join("\n")

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
    let boundSearchEntry: Gtk.Entry | null = null

    const focusSearchEntry = () => {
      if (!searchEntry) {
        return
      }

      searchEntry.grab_focus()
      searchEntry.set_position(-1)
    }

    const bindSearchEntry = (entry: Gtk.Entry) => {
      searchEntry = entry

      if (boundSearchEntry === entry) {
        return
      }

      boundSearchEntry = entry
      entry.connect("changed", () => setQuery(entry.get_text()))
      entry.connect("activate", () => runLookup())
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
      <OttolangyWindow onReady={() => timeout(120, () => focusSearchEntry())}>
        <box class="ottolangy-shell" orientation={Gtk.Orientation.VERTICAL} spacing={14}>
          <LookupToolbar
            languageOptions={languageOptions}
            fromLanguage={fromLanguage}
            toLanguage={toLanguage}
            query={query}
            settings={settings}
            onSetFromLanguage={(language) => updateLanguages("from", language)}
            onSetToLanguage={(language) => updateLanguages("to", language)}
            onSetSettings={setSettings}
            onLookup={() => runLookup()}
            onSearchEntryReady={bindSearchEntry}
          />

          <LookupResultView
            status={status}
            errorMessage={errorMessage}
            result={result}
            usedCache={usedCache}
            activeTab={activeTab}
            copiedFormKey={copiedFormKey}
            languageLabels={languageLabels}
            onSetActiveTab={setActiveTab}
            onRefreshCurrentResult={refreshCurrentResult}
            onRunReverseTranslationQuery={runReverseTranslationQuery}
            onCopy={handleCopy}
          />

          <RecentSearches
            status={status}
            recentSearches={recentSearches}
            languageLabels={languageLabels}
            onApplyRecentSearch={applyRecentSearch}
            onDeleteRecentSearch={deleteRecentSearch}
            onClearRecentSearches={clearRecentSearches}
          />
        </box>
      </OttolangyWindow>
    )
  },
})
