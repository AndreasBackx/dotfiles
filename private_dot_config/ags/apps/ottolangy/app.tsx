import GLib from "gi://GLib?version=2.0"
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

function selectedIndexFor(options: { code: string }[], code: string) {
  const index = options.findIndex((option) => option.code === code)
  return index >= 0 ? index : 0
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
    let boundSearchEntry: Gtk.Entry | null = null
    let appWindow: Gtk.Window | null = null
    let fromLanguageDropdownHost: Gtk.Box | null = null
    let toLanguageDropdownHost: Gtk.Box | null = null
    let fromLanguageDropdown: Gtk.DropDown | null = null
    let toLanguageDropdown: Gtk.DropDown | null = null
    let syncingLanguageDropdowns = false
    let copiedFormTimeoutId = 0

    const createLanguageDropdown = (
      onChange: (code: string) => void,
    ) => {
      const model = Gtk.StringList.new(languageOptions.map((option) => option.label))
      const dropdown = Gtk.DropDown.new(model, null)

      dropdown.connect("notify::selected", () => {
        const selected = dropdown.get_selected()
        const option = languageOptions[selected]

        if (syncingLanguageDropdowns || !option) {
          return
        }

        onChange(option.code)
      })

      return dropdown
    }

    const syncLanguageDropdowns = (nextFromLanguage = fromLanguage.get(), nextToLanguage = toLanguage.get()) => {
      const nextFromIndex = selectedIndexFor(languageOptions, nextFromLanguage)
      const nextToIndex = selectedIndexFor(languageOptions, nextToLanguage)

      syncingLanguageDropdowns = true

      if (fromLanguageDropdown && fromLanguageDropdown.get_selected() !== nextFromIndex) {
        fromLanguageDropdown.set_selected(nextFromIndex)
      }

      if (toLanguageDropdown && toLanguageDropdown.get_selected() !== nextToIndex) {
        toLanguageDropdown.set_selected(nextToIndex)
      }

      syncingLanguageDropdowns = false
    }

    const focusSearchEntry = () => {
      if (!searchEntry || !appWindow) {
        return
      }

      appWindow.present()
      appWindow.set_focus(searchEntry)
      searchEntry.grab_focus()
      searchEntry.set_position(-1)
    }

    const resetToRecentSearches = (options: { clearQuery?: boolean } = {}) => {
      if (options.clearQuery) {
        setQuery("")
        searchEntry?.set_text("")
      }

      setResult(null)
      setUsedCache(false)
      setErrorMessage("")
      setStatus("idle")
    }

    const bindSearchEntry = (entry: Gtk.Entry) => {
      searchEntry = entry

      if (boundSearchEntry === entry) {
        return
      }

      boundSearchEntry = entry
      entry.set_focusable(true)
      entry.set_can_focus(true)
      entry.connect("changed", () => setQuery(entry.get_text()))
      entry.connect("activate", () => runLookup())

      timeout(20, () => focusSearchEntry())
    }

    const bindFromLanguageDropdownHost = (host: Gtk.Box) => {
      if (fromLanguageDropdownHost === host) {
        return
      }

      fromLanguageDropdownHost = host

      if (!fromLanguageDropdown) {
        fromLanguageDropdown = createLanguageDropdown((language) => updateLanguages("from", language))
        fromLanguageDropdown.set_focusable(true)
        fromLanguageDropdown.set_can_focus(true)
      }

      if (fromLanguageDropdown.get_parent() !== host) {
        fromLanguageDropdown.get_parent()?.unparent()
        host.append(fromLanguageDropdown)
      }

      syncLanguageDropdowns()
    }

    const bindToLanguageDropdownHost = (host: Gtk.Box) => {
      if (toLanguageDropdownHost === host) {
        return
      }

      toLanguageDropdownHost = host

      if (!toLanguageDropdown) {
        toLanguageDropdown = createLanguageDropdown((language) => updateLanguages("to", language))
        toLanguageDropdown.set_focusable(true)
        toLanguageDropdown.set_can_focus(true)
      }

      if (toLanguageDropdown.get_parent() !== host) {
        toLanguageDropdown.get_parent()?.unparent()
        host.append(toLanguageDropdown)
      }

      syncLanguageDropdowns()
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
        resetToRecentSearches({ clearQuery: true })
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
      syncLanguageDropdowns(entry.fromLanguage, entry.toLanguage)
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
      resetToRecentSearches()
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
      syncLanguageDropdowns(nextFrom, nextTo)
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
      syncLanguageDropdowns(nextFromLanguage, nextToLanguage)
      runLookup(normalizedTranslation, nextFromLanguage, nextToLanguage)
    }

    const handleCopy = async (text: string, key: string) => {
      try {
        setCopiedFormKey(key)

        if (copiedFormTimeoutId) {
          GLib.Source.remove(copiedFormTimeoutId)
        }

        copiedFormTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1200, () => {
          setCopiedFormKey("")
          copiedFormTimeoutId = 0
          return GLib.SOURCE_REMOVE
        })

        await copyToClipboard(text)
      } catch (error) {
        console.error(error)
      }
    }

    return (
      <OttolangyWindow
        onReady={(window) => {
          appWindow = window
          window.connect("close-request", () => {
            app.quit()
            return false
          })

          timeout(120, () => {
            window.present()
            window.grab_focus()
            focusSearchEntry()
          })
        }}
      >
        <box class="ottolangy-shell" orientation={Gtk.Orientation.VERTICAL} spacing={14}>
          <LookupToolbar
            query={query}
            settings={settings}
            onSetSettings={setSettings}
            onLookup={() => runLookup()}
            onSearchEntryReady={bindSearchEntry}
            onClearSearch={() => resetToRecentSearches({ clearQuery: true })}
            onFromDropdownHostReady={bindFromLanguageDropdownHost}
            onToDropdownHostReady={bindToLanguageDropdownHost}
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
