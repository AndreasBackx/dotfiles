import GLib from "gi://GLib?version=2.0"

import { execAsync } from "ags/process"

import type {
  ConjugationCell,
  ConjugationColumn,
  ConjugationSection,
  LanguageOption,
  LookupResponse,
  LookupResult,
  LookupSettings,
  RecentSearch,
  TranslationDetails,
} from "./types"

const decoder = new TextDecoder()

const stateDir = GLib.build_filenamev([GLib.get_user_state_dir(), "ottolangy"])
const recentSearchesPath = GLib.build_filenamev([stateDir, "recent-searches.json"])
const cacheDir = GLib.build_filenamev([stateDir, "cache"])
const cacheIndexPath = GLib.build_filenamev([cacheDir, "index.json"])
const cacheVersion = 2

const languageOptions: LanguageOption[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
]

const languageLabels: Record<string, string> = {
  en: "English",
  es: "Spanish",
}

const spanishPronounOrder = ["yo", "tú", "él", "nosotros", "vosotros", "ellos"]
const englishPronounOrder = ["I", "you", "he/she/it", "we", "they", "let's"]

const spanishPronounLabels: Record<string, string> = {
  yo: "yo",
  tú: "tú",
  él: "él/ella/Ud.",
  nosotros: "nosotros",
  vosotros: "vosotros",
  ellos: "ellos/ellas/Uds.",
}

const englishPronounLabels: Record<string, string> = {
  I: "I",
  you: "you",
  "he/she/it": "he/she/it",
  we: "we",
  they: "they",
  "let's": "let's",
}

const simpleTenseEndings: Record<string, Record<"ar" | "er" | "ir", Record<string, string>>> = {
  "indicative-present": {
    ar: { yo: "o", "tú": "as", "él": "a", nosotros: "amos", vosotros: "áis", ellos: "an" },
    er: { yo: "o", "tú": "es", "él": "e", nosotros: "emos", vosotros: "éis", ellos: "en" },
    ir: { yo: "o", "tú": "es", "él": "e", nosotros: "imos", vosotros: "ís", ellos: "en" },
  },
  "indicative-preterite": {
    ar: { yo: "é", "tú": "aste", "él": "ó", nosotros: "amos", vosotros: "asteis", ellos: "aron" },
    er: { yo: "í", "tú": "iste", "él": "ió", nosotros: "imos", vosotros: "isteis", ellos: "ieron" },
    ir: { yo: "í", "tú": "iste", "él": "ió", nosotros: "imos", vosotros: "isteis", ellos: "ieron" },
  },
  "indicative-imperfect": {
    ar: { yo: "aba", "tú": "abas", "él": "aba", nosotros: "ábamos", vosotros: "abais", ellos: "aban" },
    er: { yo: "ía", "tú": "ías", "él": "ía", nosotros: "íamos", vosotros: "íais", ellos: "ían" },
    ir: { yo: "ía", "tú": "ías", "él": "ía", nosotros: "íamos", vosotros: "íais", ellos: "ían" },
  },
  "indicative-future": {
    ar: { yo: "é", "tú": "ás", "él": "á", nosotros: "emos", vosotros: "éis", ellos: "án" },
    er: { yo: "é", "tú": "ás", "él": "á", nosotros: "emos", vosotros: "éis", ellos: "án" },
    ir: { yo: "é", "tú": "ás", "él": "á", nosotros: "emos", vosotros: "éis", ellos: "án" },
  },
  "indicative-conditional": {
    ar: { yo: "ía", "tú": "ías", "él": "ía", nosotros: "íamos", vosotros: "íais", ellos: "ían" },
    er: { yo: "ía", "tú": "ías", "él": "ía", nosotros: "íamos", vosotros: "íais", ellos: "ían" },
    ir: { yo: "ía", "tú": "ías", "él": "ía", nosotros: "íamos", vosotros: "íais", ellos: "ían" },
  },
  "subjunctive-present": {
    ar: { yo: "e", "tú": "es", "él": "e", nosotros: "emos", vosotros: "éis", ellos: "en" },
    er: { yo: "a", "tú": "as", "él": "a", nosotros: "amos", vosotros: "áis", ellos: "an" },
    ir: { yo: "a", "tú": "as", "él": "a", nosotros: "amos", vosotros: "áis", ellos: "an" },
  },
  "subjunctive-imperfect-ra": {
    ar: { yo: "ara", "tú": "aras", "él": "ara", nosotros: "áramos", vosotros: "arais", ellos: "aran" },
    er: { yo: "iera", "tú": "ieras", "él": "iera", nosotros: "iéramos", vosotros: "ierais", ellos: "ieran" },
    ir: { yo: "iera", "tú": "ieras", "él": "iera", nosotros: "iéramos", vosotros: "ierais", ellos: "ieran" },
  },
  "subjunctive-imperfect-se": {
    ar: { yo: "ase", "tú": "ases", "él": "ase", nosotros: "ásemos", vosotros: "aseis", ellos: "asen" },
    er: { yo: "iese", "tú": "ieses", "él": "iese", nosotros: "iésemos", vosotros: "ieseis", ellos: "iesen" },
    ir: { yo: "iese", "tú": "ieses", "él": "iese", nosotros: "iésemos", vosotros: "ieseis", ellos: "iesen" },
  },
  "subjunctive-future": {
    ar: { yo: "are", "tú": "ares", "él": "are", nosotros: "áremos", vosotros: "areis", ellos: "aren" },
    er: { yo: "iere", "tú": "ieres", "él": "iere", nosotros: "iéremos", vosotros: "iereis", ellos: "ieren" },
    ir: { yo: "iere", "tú": "ieres", "él": "iere", nosotros: "iéremos", vosotros: "iereis", ellos: "ieren" },
  },
  "imperative-affirmative": {
    ar: { "tú": "a", "él": "e", nosotros: "emos", vosotros: "ad", ellos: "en" },
    er: { "tú": "e", "él": "a", nosotros: "amos", vosotros: "ed", ellos: "an" },
    ir: { "tú": "e", "él": "a", nosotros: "amos", vosotros: "id", ellos: "an" },
  },
  "imperative-negative": {
    ar: { "tú": "es", "él": "e", nosotros: "emos", vosotros: "éis", ellos: "en" },
    er: { "tú": "as", "él": "a", nosotros: "amos", vosotros: "áis", ellos: "an" },
    ir: { "tú": "as", "él": "a", nosotros: "amos", vosotros: "áis", ellos: "an" },
  },
}

type MlconjugMood = Record<string, unknown>
type MlconjugVerb = Record<string, MlconjugMood>
type HelperCache = Record<string, Promise<MlconjugVerb | null>>
type CacheIndexEntry = {
  key: string
  file: string
  query: string
  fromLanguage: string
  toLanguage: string
  mode: LookupResult["mode"]
  term: string
  summary: string
  cachedAt: string
}
type CacheIndex = {
  version: number
  entries: CacheIndexEntry[]
}

const helperVerbCache: HelperCache = {}

function titleCase(text: string) {
  return text
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function normalizeLabel(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function readTextFile(path: string) {
  const [, bytes] = GLib.file_get_contents(path)
  return decoder.decode(bytes)
}

function writeTextFile(path: string, text: string) {
  GLib.mkdir_with_parents(GLib.path_get_dirname(path), 0o755)
  GLib.file_set_contents(path, text)
}

function parseJson<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T
  } catch {
    return fallback
  }
}

function languageLabel(code: string) {
  return languageLabels[code] ?? code.toUpperCase()
}

function cacheStem(query: string, fromLanguage: string, toLanguage: string, settings: LookupSettings) {
  const slug = normalizeLabel(query).replace(/\s+/g, "-") || "query"
  const vosotros = settings.includeVosotros ? "vosotros" : "novosotros"
  return `v${cacheVersion}__${slug}__${fromLanguage}__${toLanguage}__${vosotros}`
}

function cachePathFor(stem: string) {
  return GLib.build_filenamev([cacheDir, `${stem}.json`])
}

function ensureCacheDir() {
  GLib.mkdir_with_parents(cacheDir, 0o755)
}

function resetCacheDir() {
  if (GLib.file_test(cacheDir, GLib.FileTest.IS_DIR)) {
    execAsync(["bash", "-lc", `rm -rf ${cacheDir}`]).catch(() => null)
  }
}

function pruneCacheIndex(predicate: (entry: CacheIndexEntry) => boolean) {
  const index = loadCacheIndex()
  const removed = index.entries.filter(predicate)
  const kept = index.entries.filter((entry) => !predicate(entry))

  for (const entry of removed) {
    const path = GLib.build_filenamev([cacheDir, entry.file])
    if (GLib.file_test(path, GLib.FileTest.EXISTS)) {
      GLib.unlink(path)
    }
  }

  if (kept.length === 0) {
    resetCacheDir()
    return
  }

  storeCacheIndex(kept)
}

function loadCacheIndex(): CacheIndex {
  if (!GLib.file_test(cacheIndexPath, GLib.FileTest.EXISTS)) {
    return { version: cacheVersion, entries: [] }
  }

  const parsed = parseJson<CacheIndex | null>(readTextFile(cacheIndexPath), null)
  if (!parsed || parsed.version !== cacheVersion || !Array.isArray(parsed.entries)) {
    resetCacheDir()
    return { version: cacheVersion, entries: [] }
  }

  return parsed
}

function storeCacheIndex(entries: CacheIndexEntry[]) {
  ensureCacheDir()
  writeTextFile(cacheIndexPath, `${JSON.stringify({ version: cacheVersion, entries: entries.slice(0, 200) }, null, 2)}\n`)
}

function readCachedLookup(query: string, fromLanguage: string, toLanguage: string, settings: LookupSettings) {
  const stem = cacheStem(query, fromLanguage, toLanguage, settings)
  const path = cachePathFor(stem)
  if (!GLib.file_test(path, GLib.FileTest.EXISTS)) {
    return null
  }

  return parseJson<LookupResult | null>(readTextFile(path), null)
}

function writeCachedLookup(query: string, fromLanguage: string, toLanguage: string, settings: LookupSettings, result: LookupResult) {
  // Keep a tiny index for history metadata, but store full results per query file
  // so repeat lookups stay fast without loading all cached payloads eagerly.
  ensureCacheDir()

  const stem = cacheStem(query, fromLanguage, toLanguage, settings)
  const file = `${stem}.json`
  writeTextFile(cachePathFor(stem), `${JSON.stringify(result, null, 2)}\n`)

  const nextEntry: CacheIndexEntry = {
    key: stem,
    file,
    query: query.trim(),
    fromLanguage,
    toLanguage,
    mode: result.mode,
    term: result.summary.term,
    summary: result.summary.oneLineTranslation,
    cachedAt: new Date().toISOString(),
  }

  const previous = loadCacheIndex().entries.filter((entry) => entry.key !== stem)
  storeCacheIndex([nextEntry, ...previous])
}

function lookupCachedSummary(entry: RecentSearch) {
  const stem = cacheStem(entry.query, entry.fromLanguage, entry.toLanguage, { includeVosotros: false })
  const match = loadCacheIndex().entries.find((item) => item.key === stem)
  return match?.summary ?? entry.summary ?? ""
}

export function loadLanguageOptions() {
  return [...languageOptions]
}

export function normalizeQuery(query: string) {
  return query.trim().toLowerCase()
}

export function loadRecentSearches() {
  if (!GLib.file_test(recentSearchesPath, GLib.FileTest.EXISTS)) {
    return [] as RecentSearch[]
  }

  const entries = parseJson<RecentSearch[]>(readTextFile(recentSearchesPath), [])
  return entries
    .filter((entry) => Boolean(entry.query?.trim() && entry.fromLanguage && entry.toLanguage))
    .map((entry) => ({
      ...entry,
      query: normalizeQuery(entry.query),
      summary: (lookupCachedSummary(entry) || entry.summary || "").trim().toLowerCase(),
      mode: entry.mode ?? loadCacheIndex().entries.find((item) => item.key === cacheStem(entry.query, entry.fromLanguage, entry.toLanguage, { includeVosotros: false }))?.mode,
    }))
}

export function persistRecentSearches(searches: RecentSearch[]) {
  writeTextFile(recentSearchesPath, `${JSON.stringify(searches.slice(0, 12), null, 2)}\n`)
}

export function pushRecentSearch(searches: RecentSearch[], next: RecentSearch) {
  const normalizedQuery = normalizeQuery(next.query)
  const deduped = searches.filter(
    (entry) =>
      normalizeQuery(entry.query) !== normalizedQuery ||
      entry.fromLanguage !== next.fromLanguage ||
      entry.toLanguage !== next.toLanguage,
  )

  return [
    {
      ...next,
      query: normalizedQuery,
      summary: next.summary?.trim().toLowerCase(),
      mode: next.mode,
    },
    ...deduped,
  ].slice(0, 12)
}

export function deleteRecentSearchCache(entry: RecentSearch, settings: LookupSettings) {
  const normalizedQuery = normalizeQuery(entry.query)
  pruneCacheIndex(
    (item) =>
      item.query === normalizedQuery &&
      item.fromLanguage === entry.fromLanguage &&
      item.toLanguage === entry.toLanguage,
  )
}

export function clearAllRecentSearchCaches() {
  resetCacheDir()
}

async function translateText(query: string, fromLanguage: string, toLanguage: string): Promise<TranslationDetails | null> {
  if (!query.trim()) {
    return null
  }

  if (fromLanguage === toLanguage) {
    return {
      primary: query.trim(),
      backend: "Identity",
      fromLanguage,
      toLanguage,
      note: "Source and target languages match.",
    }
  }

  try {
    const primary = (await execAsync(["argos-translate", "-f", fromLanguage, "-t", toLanguage, query])).trim()
    if (!primary) {
      return null
    }

    let reverse: string | null = null
    try {
      reverse = (await execAsync(["argos-translate", "-f", toLanguage, "-t", fromLanguage, primary])).trim() || null
    } catch {
      reverse = null
    }

    return {
      primary,
      reverse,
      backend: "Argos Translate",
      fromLanguage,
      toLanguage,
      note: null,
    }
  } catch (error) {
    throw new Error(`Translation failed for ${languageLabel(fromLanguage)} -> ${languageLabel(toLanguage)}: ${String(error)}`)
  }
}

function extractScalarEntry(entry: unknown) {
  if (typeof entry === "string") {
    return entry
  }

  if (entry && typeof entry === "object") {
    const values = Object.values(entry as Record<string, unknown>)
    const firstString = values.find((value) => typeof value === "string" && value.trim())
    return typeof firstString === "string" ? firstString : null
  }

  return null
}

function normalizePersonKey(person: string) {
  const cleaned = normalizeLabel(person)

  if (cleaned.startsWith("tu")) return "tú"
  if (cleaned.startsWith("vosotros")) return "vosotros"
  if (cleaned.startsWith("nosotros")) return "nosotros"
  if (cleaned.startsWith("ellos")) return "ellos"
  if (cleaned.startsWith("yo")) return "yo"
  if (cleaned.startsWith("el")) return "él"

  return cleaned
}

function normalizeEnglishPersonKey(person: string) {
  const cleaned = person.trim().toLowerCase()
  if (cleaned === "") return ""
  if (cleaned === "i") return "I"
  if (cleaned === "you") return "you"
  if (cleaned === "he/she/it") return "he/she/it"
  if (cleaned === "we") return "we"
  if (cleaned === "they") return "they"
  if (cleaned === "let's") return "let's"
  return person.trim()
}

function normalizeSpanishFormsRecord(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    return null
  }

  const values: Record<string, string> = {}

  for (const [person, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== "string" || !value.trim()) {
      continue
    }

    const normalizedPerson = normalizePersonKey(person)
    if (spanishPronounOrder.includes(normalizedPerson)) {
      values[normalizedPerson] = value.trim()
    }
  }

  return Object.keys(values).length > 0 ? values : null
}

function normalizeEnglishFormsRecord(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    return null
  }

  const values: Record<string, string> = {}

  for (const [person, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== "string" || !value.trim()) {
      continue
    }

    const normalizedPerson = normalizeEnglishPersonKey(person)
    if (englishPronounOrder.includes(normalizedPerson)) {
      values[normalizedPerson] = value.trim()
    }
  }

  return Object.keys(values).length > 0 ? values : null
}

function extractCanonicalMood(rawVerb: MlconjugVerb, moodName: string, normalizeForms: (raw: unknown) => Record<string, string> | null) {
  const entry = rawVerb[moodName]
  if (!entry || typeof entry !== "object") {
    return new Map<string, Record<string, string>>()
  }

  const normalized = new Map<string, Record<string, string>>()
  for (const [tenseName, value] of Object.entries(entry)) {
    const forms = normalizeForms(value)
    if (forms) {
      normalized.set(normalizeLabel(tenseName), forms)
    }
  }

  return normalized
}

function chooseForms(mood: Map<string, Record<string, string>>, candidates: string[]) {
  for (const candidate of candidates) {
    const forms = mood.get(normalizeLabel(candidate))
    if (forms && Object.keys(forms).length > 0) {
      return forms
    }
  }

  return null
}

function escapeMarkup(text: string) {
  return GLib.markup_escape_text(text, -1)
}

function commonPrefixLength(left: string, right: string) {
  let index = 0
  while (index < left.length && index < right.length && left[index] === right[index]) {
    index += 1
  }
  return index
}

function buildExpectedForm(infinitive: string, columnKey: string, person: string) {
  const ending = infinitive.slice(-2) as "ar" | "er" | "ir"
  const endings = simpleTenseEndings[columnKey]?.[ending]
  if (!endings?.[person]) {
    return null
  }

  if (columnKey === "indicative-future" || columnKey === "indicative-conditional") {
    return `${infinitive}${endings[person]}`
  }

  return `${infinitive.slice(0, -2)}${endings[person]}`
}

function buildFormMarkup(text: string, infinitive: string, columnKey: string, person: string) {
  // Multi-word forms are easier to scan when the helper words are subdued and
  // the final lexical verb carries the visual emphasis.
  const tokens = text.trim().split(/\s+/)
  if (tokens.length > 1) {
    const leading = escapeMarkup(tokens.slice(0, -1).join(" "))
    const trailing = escapeMarkup(tokens.at(-1) ?? "")
    return `${leading ? `<span foreground="#6e6e6e">${leading}</span> ` : ""}${trailing}`
  }

  const expected = buildExpectedForm(infinitive, columnKey, person)
  if (!expected) {
    const repeatLength = commonPrefixLength(text, infinitive.slice(0, -2))
    const stem = escapeMarkup(text.slice(0, repeatLength))
    const rest = escapeMarkup(text.slice(repeatLength))
    return `${stem ? `<span foreground="#6e6e6e">${stem}</span>` : ""}${rest}`
  }

  const matchingPrefix = commonPrefixLength(text, expected)
  const stemPrefix = Math.min(commonPrefixLength(text, infinitive.slice(0, -2)), matchingPrefix)

  const repeated = escapeMarkup(text.slice(0, stemPrefix))
  const irregular = escapeMarkup(text.slice(stemPrefix, matchingPrefix))
  const changed = escapeMarkup(text.slice(matchingPrefix))

  if (text === expected) {
    const remainder = escapeMarkup(text.slice(stemPrefix))
    return `${repeated ? `<span foreground="#6e6e6e">${repeated}</span>` : ""}${remainder}`
  }

  return `${repeated ? `<span foreground="#6e6e6e">${repeated}</span>` : ""}${irregular}${changed ? `<span foreground="#ccc47a">${changed}</span>` : ""}`
}

function filterForms(forms: Record<string, string> | null, settings: LookupSettings) {
  if (!forms) {
    return null
  }

  const values: Record<string, string> = {}
  for (const person of spanishPronounOrder) {
    if (person === "vosotros" && !settings.includeVosotros) {
      continue
    }
    if (forms[person]) {
      values[person] = forms[person]
    }
  }

  return Object.keys(values).length > 0 ? values : null
}

function filterEnglishForms(forms: Record<string, string> | null) {
  if (!forms) {
    return null
  }

  const values: Record<string, string> = {}
  for (const person of englishPronounOrder) {
    if (forms[person]) {
      values[person] = forms[person]
    }
  }

  return Object.keys(values).length > 0 ? values : null
}

function buildColumn(key: string, title: string, forms: Record<string, string> | null, settings: LookupSettings, infinitive: string): ConjugationColumn | null {
  const filtered = filterForms(forms, settings)
  if (!filtered) {
    return null
  }

  const values = Object.fromEntries(
    Object.entries(filtered).map(([person, text]) => [person, { text, markup: buildFormMarkup(text, infinitive, key, person) } satisfies ConjugationCell]),
  )

  return { key, title, values }
}

function buildSection(key: string, title: string, columns: Array<ConjugationColumn | null>): ConjugationSection | null {
  const filtered = columns.filter(Boolean) as ConjugationColumn[]
  if (filtered.length === 0) {
    return null
  }

  const pronouns = spanishPronounOrder
    .filter((person) => filtered.some((column) => Boolean(column.values[person])))
    .map((person) => ({ key: person, label: spanishPronounLabels[person] ?? person }))

  return pronouns.length > 0 ? { key, title, pronouns, columns: filtered } : null
}

function buildEnglishColumn(key: string, title: string, forms: Record<string, string> | null, infinitive: string): ConjugationColumn | null {
  const filtered = filterEnglishForms(forms)
  if (!filtered) {
    return null
  }

  const values = Object.fromEntries(
    Object.entries(filtered).map(([person, text]) => [person, { text, markup: buildFormMarkup(text, infinitive, key, person) } satisfies ConjugationCell]),
  )

  return { key, title, values }
}

function buildEnglishSection(key: string, title: string, columns: Array<ConjugationColumn | null>): ConjugationSection | null {
  const filtered = columns.filter(Boolean) as ConjugationColumn[]
  if (filtered.length === 0) {
    return null
  }

  const pronouns = englishPronounOrder
    .filter((person) => filtered.some((column) => Boolean(column.values[person])))
    .map((person) => ({ key: person, label: englishPronounLabels[person] ?? person }))

  return pronouns.length > 0 ? { key, title, pronouns, columns: filtered } : null
}

function addSuffixToForms(forms: Record<string, string> | null, suffix: string) {
  if (!forms) {
    return null
  }

  return Object.fromEntries(Object.entries(forms).map(([person, value]) => [person, `${value} ${suffix}`.trim()]))
}

function chunkColumns<T>(items: T[], columnsPerRow = 3) {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += columnsPerRow) {
    chunks.push(items.slice(index, index + columnsPerRow))
  }
  return chunks
}

async function runMlconjug3(language: string, query: string) {
  const outputPath = GLib.build_filenamev([GLib.get_tmp_dir(), `ottolangy-${GLib.uuid_string_random()}.json`])

  try {
    await execAsync(["mlconjug3", "-l", language, "-s", "pronoun", "-f", "json", "-o", outputPath, query])
    const parsed = parseJson<Record<string, MlconjugVerb>>(readTextFile(outputPath), {})
    const [lemma, rawVerb] = Object.entries(parsed)[0] ?? []
    if (!lemma || !rawVerb || Object.keys(rawVerb).length === 0) {
      return null
    }
    return { lemma, rawVerb }
  } catch {
    return null
  } finally {
    if (GLib.file_test(outputPath, GLib.FileTest.EXISTS)) {
      GLib.unlink(outputPath)
    }
  }
}

async function getHelperVerb(language: string, verb: string) {
  const key = `${language}:${verb}`
  if (!helperVerbCache[key]) {
    helperVerbCache[key] = runMlconjug3(language, verb).then((result) => result?.rawVerb ?? null)
  }

  return helperVerbCache[key]
}

function deriveProgressiveSection(gerund: string | null, estar: MlconjugVerb, settings: LookupSettings, infinitive: string) {
  if (!gerund) {
    return null
  }

  const indicative = extractCanonicalMood(estar, "Indicativo", normalizeSpanishFormsRecord)
  const conditional = extractCanonicalMood(estar, "Condicional", normalizeSpanishFormsRecord)

  return buildSection("progressive", "Progressive", [
    buildColumn("progressive-present", "Present", addSuffixToForms(chooseForms(indicative, ["Indicativo presente"]), gerund), settings, infinitive),
    buildColumn("progressive-preterite", "Preterite", addSuffixToForms(chooseForms(indicative, ["Indicativo pretérito perfecto simple"]), gerund), settings, infinitive),
    buildColumn("progressive-imperfect", "Imperfect", addSuffixToForms(chooseForms(indicative, ["Indicativo pretérito imperfecto"]), gerund), settings, infinitive),
    buildColumn("progressive-conditional", "Conditional", addSuffixToForms(chooseForms(conditional, ["Condicional condicional"]), gerund), settings, infinitive),
    buildColumn("progressive-future", "Future", addSuffixToForms(chooseForms(indicative, ["Indicativo futuro"]), gerund), settings, infinitive),
  ])
}

function derivePerfectSection(participle: string | null, haber: MlconjugVerb, settings: LookupSettings, infinitive: string) {
  if (!participle) {
    return null
  }

  const indicative = extractCanonicalMood(haber, "Indicativo", normalizeSpanishFormsRecord)
  const conditional = extractCanonicalMood(haber, "Condicional", normalizeSpanishFormsRecord)

  return buildSection("perfect", "Perfect", [
    buildColumn("perfect-present", "Present Perfect", addSuffixToForms(chooseForms(indicative, ["Indicativo presente"]), participle), settings, infinitive),
    buildColumn("perfect-preterite", "Preterite Perfect", addSuffixToForms(chooseForms(indicative, ["Indicativo pretérito perfecto simple"]), participle), settings, infinitive),
    buildColumn("perfect-past", "Past Perfect", addSuffixToForms(chooseForms(indicative, ["Indicativo pretérito imperfecto"]), participle), settings, infinitive),
    buildColumn("perfect-conditional", "Conditional Perfect", addSuffixToForms(chooseForms(conditional, ["Condicional condicional"]), participle), settings, infinitive),
    buildColumn("perfect-future", "Future Perfect", addSuffixToForms(chooseForms(indicative, ["Indicativo futuro"]), participle), settings, infinitive),
  ])
}

function derivePerfectSubjunctiveSection(participle: string | null, haber: MlconjugVerb, settings: LookupSettings, infinitive: string) {
  if (!participle) {
    return null
  }

  const subjunctive = extractCanonicalMood(haber, "Subjuntivo", normalizeSpanishFormsRecord)

  return buildSection("perfect-subjunctive", "Perfect Subjunctive", [
    buildColumn("perfect-subj-present", "Present Perfect", addSuffixToForms(chooseForms(subjunctive, ["Subjuntivo presente"]), participle), settings, infinitive),
    buildColumn("perfect-subj-imperfect-ra", "Past Perfect (-ra)", addSuffixToForms(chooseForms(subjunctive, ["Subjuntivo pretérito imperfecto 1"]), participle), settings, infinitive),
    buildColumn("perfect-subj-imperfect-se", "Past Perfect (-se)", addSuffixToForms(chooseForms(subjunctive, ["Subjuntivo pretérito imperfecto 2"]), participle), settings, infinitive),
    buildColumn("perfect-subj-future", "Future Perfect", addSuffixToForms(chooseForms(subjunctive, ["Subjuntivo futuro"]), participle), settings, infinitive),
  ])
}

function deriveInformalFutureSection(infinitive: string, ir: MlconjugVerb, settings: LookupSettings) {
  const indicative = extractCanonicalMood(ir, "Indicativo", normalizeSpanishFormsRecord)
  return buildSection("informal-future", "Informal Future", [
    buildColumn("informal-future", "Near Future", addSuffixToForms(chooseForms(indicative, ["Indicativo presente"]), `a ${infinitive}`), settings, infinitive),
  ])
}

async function buildSpanishConjugationResult(query: string, translation: TranslationDetails | null, settings: LookupSettings): Promise<LookupResult | null> {
  const verbResult = await runMlconjug3("es", query)
  if (!verbResult) {
    return null
  }

  const { lemma, rawVerb } = verbResult
  const infinitive = extractScalarEntry(rawVerb.Infinitivo?.[Object.keys(rawVerb.Infinitivo ?? {})[0]]) ?? lemma
  const gerund = extractScalarEntry(rawVerb.Gerundio?.[Object.keys(rawVerb.Gerundio ?? {})[0]])
  const participle = extractScalarEntry(rawVerb.Participo?.[Object.keys(rawVerb.Participo ?? {})[0]] ?? rawVerb.Participo)

  const indicative = extractCanonicalMood(rawVerb, "Indicativo", normalizeSpanishFormsRecord)
  const subjunctive = extractCanonicalMood(rawVerb, "Subjuntivo", normalizeSpanishFormsRecord)
  const imperative = extractCanonicalMood(rawVerb, "Imperativo", normalizeSpanishFormsRecord)
  const conditional = extractCanonicalMood(rawVerb, "Condicional", normalizeSpanishFormsRecord)

  const [estar, haber, ir] = await Promise.all([getHelperVerb("es", "estar"), getHelperVerb("es", "haber"), getHelperVerb("es", "ir")])

  const sections = [
    buildSection("indicative", "Indicative", [
      buildColumn("indicative-present", "Present", chooseForms(indicative, ["Indicativo presente"]), settings, infinitive),
      buildColumn("indicative-preterite", "Preterite", chooseForms(indicative, ["Indicativo pretérito perfecto simple"]), settings, infinitive),
      buildColumn("indicative-imperfect", "Imperfect", chooseForms(indicative, ["Indicativo pretérito imperfecto"]), settings, infinitive),
      buildColumn("indicative-conditional", "Conditional", chooseForms(conditional, ["Condicional condicional"]), settings, infinitive),
      buildColumn("indicative-future", "Future", chooseForms(indicative, ["Indicativo futuro"]), settings, infinitive),
    ]),
    buildSection("subjunctive", "Subjunctive", [
      buildColumn("subjunctive-present", "Present", chooseForms(subjunctive, ["Subjuntivo presente"]), settings, infinitive),
      buildColumn("subjunctive-imperfect-ra", "Imperfect (-ra)", chooseForms(subjunctive, ["Subjuntivo pretérito imperfecto 1"]), settings, infinitive),
      buildColumn("subjunctive-imperfect-se", "Imperfect (-se)", chooseForms(subjunctive, ["Subjuntivo pretérito imperfecto 2"]), settings, infinitive),
      buildColumn("subjunctive-future", "Future", chooseForms(subjunctive, ["Subjuntivo futuro"]), settings, infinitive),
    ]),
    buildSection("imperative", "Imperative", [
      buildColumn("imperative-affirmative", "Affirmative", chooseForms(imperative, ["Imperativo afirmativo"]), settings, infinitive),
      buildColumn("imperative-negative", "Negative", chooseForms(imperative, ["Imperativo non"]), settings, infinitive),
    ]),
    estar ? deriveProgressiveSection(gerund, estar, settings, infinitive) : null,
    haber ? derivePerfectSection(participle, haber, settings, infinitive) : null,
    haber ? derivePerfectSubjunctiveSection(participle, haber, settings, infinitive) : null,
    ir ? deriveInformalFutureSection(infinitive, ir, settings) : null,
  ].filter(Boolean) as ConjugationSection[]

  return {
    mode: "verb",
    defaultTab: "conjugation",
    summary: {
      term: titleCase(lemma),
      oneLineTranslation: translation?.primary ?? "Translation unavailable",
      partOfSpeech: "verb",
      infinitive,
      gerund,
      participle,
      notes: [`Spanish infinitive: ${infinitive}`, gerund ? `Gerund: ${gerund}` : null, participle ? `Participle: ${participle}` : null].filter(Boolean) as string[],
    },
    translation,
    conjugation: {
      sections,
    },
    warnings: [],
  }
}

async function buildEnglishConjugationResult(query: string, translation: TranslationDetails | null): Promise<LookupResult | null> {
  const verbResult = await runMlconjug3("en", query)
  if (!verbResult) {
    return null
  }

  const { lemma, rawVerb } = verbResult
  const infinitive = extractScalarEntry(rawVerb.infinitive?.[Object.keys(rawVerb.infinitive ?? {})[0]]) ?? `to ${lemma}`
  const indicative = extractCanonicalMood(rawVerb, "indicative", normalizeEnglishFormsRecord)
  const imperative = extractCanonicalMood(rawVerb, "imperative", normalizeEnglishFormsRecord)

  const sections = [
    buildEnglishSection("indicative", "Indicative", [
      buildEnglishColumn("en-indicative-present", "Present", chooseForms(indicative, ["indicative present"]), infinitive),
      buildEnglishColumn("en-indicative-past", "Past", chooseForms(indicative, ["indicative past tense"]), infinitive),
      buildEnglishColumn("en-indicative-continuous", "Continuous", chooseForms(indicative, ["indicative present continuous"]), infinitive),
      buildEnglishColumn("en-indicative-perfect", "Perfect", chooseForms(indicative, ["indicative present perfect"]), infinitive),
    ]),
    buildEnglishSection("imperative", "Imperative", [
      buildEnglishColumn("en-imperative-present", "Present", chooseForms(imperative, ["imperative present"]), infinitive),
    ]),
  ].filter(Boolean) as ConjugationSection[]

  return {
    mode: "verb",
    defaultTab: "conjugation",
    summary: {
      term: titleCase(lemma),
      oneLineTranslation: translation?.primary ?? "Translation unavailable",
      partOfSpeech: "verb",
      infinitive,
      notes: [`English infinitive: ${infinitive}`],
    },
    translation,
    conjugation: { sections },
    warnings: [],
  }
}

function buildTranslationOnlyResult(query: string, translation: TranslationDetails | null): LookupResult {
  return {
    mode: "translation",
    defaultTab: "translation",
    summary: {
      term: titleCase(query.trim()),
      oneLineTranslation: translation?.primary ?? "Translation unavailable",
      partOfSpeech: "translation",
      notes: translation ? [`Translated with ${translation.backend}.`, `Direction: ${languageLabel(translation.fromLanguage)} -> ${languageLabel(translation.toLanguage)}.`] : ["No translation was available for this input."],
    },
    translation,
    conjugation: null,
    warnings: [],
  }
}

async function lookupFresh(query: string, fromLanguage: string, toLanguage: string, settings: LookupSettings): Promise<LookupResult> {
  const trimmed = normalizeQuery(query)
  if (!trimmed) {
    throw new Error("Type a word or phrase to look up.")
  }

  const isSingleToken = !trimmed.includes(" ")

  let translation: TranslationDetails | null = null
  let translationError: string | null = null

  try {
    translation = await translateText(trimmed, fromLanguage, toLanguage)
  } catch (error) {
    translationError = String(error)
  }

  if (fromLanguage === "es" && isSingleToken) {
    const verbResult = await buildSpanishConjugationResult(trimmed, translation, settings)
    if (verbResult) {
      if (translationError) {
        verbResult.warnings.unshift(translationError)
      }
      return verbResult
    }
  }

  if (fromLanguage === "en" && isSingleToken) {
    const verbResult = await buildEnglishConjugationResult(trimmed, translation)
    if (verbResult) {
      if (translationError) {
        verbResult.warnings.unshift(translationError)
      }
      return verbResult
    }
  }

  if (translationError) {
    throw new Error(translationError)
  }

  const translationResult = buildTranslationOnlyResult(trimmed, translation)
  if (fromLanguage === "es" || fromLanguage === "en") {
    translationResult.warnings.push(`This term was not recognized as a ${languageLabel(fromLanguage).toLowerCase()} verb by mlconjug3, so only translation is shown.`)
  }
  return translationResult
}

export async function lookup(
  query: string,
  fromLanguage: string,
  toLanguage: string,
  settings: LookupSettings,
  options: { forceRefresh?: boolean } = {},
): Promise<LookupResponse> {
  if (!options.forceRefresh) {
    const cached = readCachedLookup(query, fromLanguage, toLanguage, settings)
    if (cached) {
      return { result: cached, cached: true }
    }
  }

  const result = await lookupFresh(query, fromLanguage, toLanguage, settings)
  writeCachedLookup(query, fromLanguage, toLanguage, settings, result)
  return { result, cached: false }
}
