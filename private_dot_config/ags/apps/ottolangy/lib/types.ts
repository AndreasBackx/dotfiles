export type LanguageOption = {
  code: string
  label: string
}

export type RecentSearch = {
  query: string
  fromLanguage: string
  toLanguage: string
  summary?: string
  mode?: "verb" | "translation"
}

export type PronounEntry = {
  key: string
  label: string
}

export type ConjugationColumn = {
  key: string
  title: string
  values: Record<string, ConjugationCell>
}

export type ConjugationCell = {
  text: string
  markup: string
}

export type ConjugationSection = {
  key: string
  title: string
  pronouns: PronounEntry[]
  columns: ConjugationColumn[]
}

export type TranslationDetails = {
  primary: string
  reverse?: string | null
  backend: string
  fromLanguage: string
  toLanguage: string
  note?: string | null
}

export type LookupSummary = {
  term: string
  oneLineTranslation: string
  partOfSpeech: string
  infinitive?: string | null
  gerund?: string | null
  participle?: string | null
  notes: string[]
}

export type LookupResult = {
  mode: "verb" | "translation"
  defaultTab: "translation" | "conjugation"
  summary: LookupSummary
  translation: TranslationDetails | null
  conjugation: {
    sections: ConjugationSection[]
  } | null
  warnings: string[]
}

export type LookupSettings = {
  includeVosotros: boolean
}

export type LookupResponse = {
  result: LookupResult
  cached: boolean
}
