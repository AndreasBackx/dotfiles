import type { ConjugationColumn } from "./types"

export function formatLanguagePair(fromLanguage: string, toLanguage: string, labels: Map<string, string>) {
  return `${labels.get(fromLanguage) ?? fromLanguage.toUpperCase()} -> ${labels.get(toLanguage) ?? toLanguage.toUpperCase()}`
}

export function chunkColumns(items: ConjugationColumn[], columnsPerRow = 4) {
  const chunks: ConjugationColumn[][] = []

  for (let index = 0; index < items.length; index += columnsPerRow) {
    chunks.push(items.slice(index, index + columnsPerRow))
  }

  return chunks
}
