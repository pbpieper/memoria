/* ═══════════════════════════════════════════════════════════════════════════
   Words of a line, for every tool where you type from memory.
   Punctuation is shown as fixed text and is never part of an answer.
   ═══════════════════════════════════════════════════════════════════════════ */

/** One word of a line, with the punctuation around it kept as fixed text. */
export interface WordToken {
  /** Punctuation before the word, e.g. the opening quote of "Well */
  pre: string
  /** What you type. Empty for a piece that is only punctuation, like a lone "—" */
  word: string
  /** Punctuation after the word, e.g. the comma of addictions, or the … of system…but */
  post: string
  /** A space follows. False between system… and but, which are written together */
  spaceAfter: boolean
}

// Letters and digits in any script, with apostrophes or hyphens inside the word:
// l'argent, it's, Choisis-en stay one word. "…", "—", quotes and commas never join words.
const WORD = /[\p{L}\p{M}\p{N}]+(?:['’ʼ‘\-‐][\p{L}\p{M}\p{N}]+)*/gu

export function splitWords(text: string): WordToken[] {
  const out: WordToken[] = []
  for (const piece of (text || '').normalize('NFC').split(/\s+/).filter(Boolean)) {
    const matches = [...piece.matchAll(WORD)]
    if (matches.length === 0) {
      out.push({ pre: '', word: '', post: piece, spaceAfter: true })
      continue
    }
    matches.forEach((m, k) => {
      const start = m.index ?? 0
      const end = start + m[0].length
      const nextStart = k + 1 < matches.length ? (matches[k + 1].index ?? piece.length) : piece.length
      out.push({
        pre: k === 0 ? piece.slice(0, start) : '',
        word: m[0],
        post: piece.slice(end, nextStart),
        spaceAfter: k === matches.length - 1,
      })
    })
  }
  return out
}

/**
 * How a typed answer is compared with the text: it must match exactly, except for
 * capital letters, the kind of apostrophe (’ and ' are the same) and punctuation at
 * the edges. Accents count, and so does an apostrophe inside a word (it's ≠ its).
 */
export function normalizeAnswer(s: string): string {
  return (s || '')
    .normalize('NFC')
    .replace(/[\u200B-\u200D\u00AD\uFEFF]/g, '')
    .replace(/[’ʼ‘`´′]/g, "'")
    .replace(/‐/g, '-')
    // Punctuation typed at the edges is ignored (addictions, = addictions; singin' = singin),
    // so only the word itself counts. Apostrophes inside a word still must be typed.
    .replace(/^[^\p{L}\p{M}\p{N}]+|[^\p{L}\p{M}\p{N}]+$/gu, '')
    // Not toLocaleLowerCase: on a Turkish phone that would turn I into ı and break it's
    .toLowerCase()
}

/** The words of a text in compare form, punctuation left out. */
export function wordsOf(text: string): string[] {
  return splitWords(text).map(t => normalizeAnswer(t.word)).filter(Boolean)
}

/** Number of letters in a word, in any script (été has 3). */
export function letterCount(word: string): number {
  return (word.match(/\p{L}/gu) || []).length
}

/** Turns off the phone keyboard's help, so the answer is exactly what you typed. */
export const PRECISE_TYPING = {
  autoCorrect: 'off',
  autoCapitalize: 'none',
  autoComplete: 'off',
  spellCheck: false,
} as const
