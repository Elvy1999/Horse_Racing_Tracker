import type { HistoryRecord } from './types'

const HISTORY_KEY = 'decoo-reclamo-history'

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
