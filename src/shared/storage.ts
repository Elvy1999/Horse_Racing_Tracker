import type { HistoryRecord } from '../features/calculator/types'

const HISTORY_KEY = 'decoo-reclamo-history'
const HORSE_NAMES_KEY = 'decoo-horse-names'

export function normalizeHorseName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

export function buildHorseNameList(names: string[]): string[] {
  const uniqueNames = new Map<string, string>()

  for (const name of names) {
    const normalizedName = normalizeHorseName(name)

    if (!normalizedName) {
      continue
    }

    const normalizedKey = normalizedName.toLocaleLowerCase('es-DO')

    if (!uniqueNames.has(normalizedKey)) {
      uniqueNames.set(normalizedKey, normalizedName)
    }
  }

  return Array.from(uniqueNames.values()).sort((left, right) =>
    left.localeCompare(right, 'es', { sensitivity: 'base' }),
  )
}

export function loadHistoryRecords(): HistoryRecord[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawValue = window.localStorage.getItem(HISTORY_KEY)
    if (!rawValue) {
      return []
    }

    return JSON.parse(rawValue) as HistoryRecord[]
  } catch {
    return []
  }
}

export function saveHistoryRecords(records: HistoryRecord[]): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(records))
}

export function loadHorseNames(): string[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawValue = window.localStorage.getItem(HORSE_NAMES_KEY)
    if (!rawValue) {
      return []
    }

    return buildHorseNameList(JSON.parse(rawValue) as string[])
  } catch {
    return []
  }
}

export function saveHorseNames(names: string[]): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(HORSE_NAMES_KEY, JSON.stringify(buildHorseNameList(names)))
}
