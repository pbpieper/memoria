import type { SentNote } from '@/services/types'

const KEY = 'memoria-feedback-sent'

/** Notes sent from this device, kept in this browser only. */
export function loadSentNotes(): SentNote[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') as SentNote[] }
  catch { return [] }
}

export function recordSentNote(body: string): void {
  try {
    const list = loadSentNotes()
    list.push({ body, at: new Date().toISOString() })
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch { /* private mode: the note was still sent */ }
}
