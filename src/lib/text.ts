import type { Chunk, MacroSection, Skit } from '@/types/skit'

/* ═══════════════════════════════════════════════════════════════════════════
   Text helpers shared by the practice tools.
   Works for any Latin-script language (accents, apostrophes), not only English.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Compare form of a word: no accents, no punctuation, lower case. "Être," → "etre" */
export function normalizeWord(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .toLowerCase()
}

/** Number of letters/digits in a word (ignores punctuation). */
export function letterCount(s: string): number {
  return (s.match(/[\p{L}\p{N}]/gu) || []).length
}

/** Word → first letter + trailing punctuation. "l'argent," → "l," */
export function firstLetterOf(word: string): string {
  const m = word.match(/^([^\p{L}\p{N}]*)([\p{L}\p{N}])/u)
  if (!m) return word
  const trail = word.match(/[^\p{L}\p{N}]*$/u)?.[0] || ''
  return m[1] + m[2] + trail
}

/** Speaker labels only help when a text has more than one speaker. */
export function hasMultipleSpeakers(speakers: string[]): boolean {
  return speakers.filter(s => s && s.trim()).length > 1
}

// Cyrillic letters that look like Latin ones. Lyrics sites sometimes mix them in;
// they look right but never match what you type.
const CONFUSABLES: Record<string, string> = {
  'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'у': 'y', 'х': 'x', 'і': 'i',
  'А': 'A', 'Е': 'E', 'О': 'O', 'Р': 'P', 'С': 'C', 'Т': 'T', 'Х': 'X', 'М': 'M', 'Н': 'H', 'К': 'K', 'В': 'B',
}

/** Replace look-alike Cyrillic letters, but only in lines that are mostly Latin. */
export function fixConfusables(text: string): string {
  if (!/[Ѐ-ӿ]/.test(text)) return text
  const latin = (text.match(/[A-Za-zÀ-ÿ]/g) || []).length
  const cyr = (text.match(/[Ѐ-ӿ]/g) || []).length
  if (cyr * 4 > latin) return text // a real Cyrillic text: leave it alone
  return text.replace(/[Ѐ-ӿ]/g, ch => CONFUSABLES[ch] ?? ch)
}

const MAX_LINES_PER_CHUNK = 12
const LINES_PER_SPLIT = 8

function labelFromLine(text: string): string {
  return text.split(/\s+/).slice(0, 4).join(' ').replace(/[\s:;,.!?]+$/, '') + '…'
}

/** Split any chunk longer than 12 lines into 8-line sections. */
export function splitLongChunks(chunks: Chunk[]): { chunks: Chunk[]; changed: boolean } {
  if (!chunks.some(c => c.lines.length > MAX_LINES_PER_CHUNK)) return { chunks, changed: false }
  const out: Chunk[] = []
  for (const c of chunks) {
    if (c.lines.length <= MAX_LINES_PER_CHUNK) {
      out.push({ ...c, id: out.length + 1 })
      continue
    }
    for (let i = 0; i < c.lines.length; i += LINES_PER_SPLIT) {
      const lines = c.lines.slice(i, i + LINES_PER_SPLIT)
      out.push({ id: out.length + 1, label: labelFromLine(lines[0].text), lines })
    }
  }
  return { chunks: out, changed: true }
}

export function defaultMacroSections(chunks: Chunk[]): MacroSection[] {
  const ids = chunks.map(c => c.id)
  const sections: MacroSection[] = [{ id: 'all', label: 'Everything', chunks: ids }]
  if (ids.length >= 4) {
    const half = Math.ceil(ids.length / 2)
    sections.push({ id: 'm1', label: `First half (1-${half})`, chunks: ids.slice(0, half) })
    sections.push({ id: 'm2', label: `Second half (${half + 1}-${ids.length})`, chunks: ids.slice(half) })
  }
  return sections
}

/** Make a stored text practice-ready: no look-alike letters, no 50-line sections. */
export function normalizeSkit(skit: Skit): Skit {
  let dirty = false
  let chunks = skit.chunks.map(c => ({
    ...c,
    lines: c.lines.map(l => {
      const text = fixConfusables(l.text)
      if (text !== l.text) dirty = true
      return text === l.text ? l : { ...l, text }
    }),
  }))
  const split = splitLongChunks(chunks)
  chunks = split.chunks
  if (!dirty && !split.changed) return skit
  return {
    ...skit,
    chunks,
    macroSections: split.changed ? defaultMacroSections(chunks) : skit.macroSections,
    // "1 chunks, PERFORMER" is the importer's placeholder, not something Patrick wrote
    subtitle: split.changed && /^\d+ chunks,/.test(skit.subtitle) ? `${chunks.length} sections` : skit.subtitle,
  }
}
