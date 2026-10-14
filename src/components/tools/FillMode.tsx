import { useState, useMemo, useRef, useEffect } from 'react'
import { useSkitContext } from '@/context/SkitContext'
import { SectionChips, linesForSection } from '@/components/molecules/SectionChips'
import { normalizeWord, letterCount, firstLetterOf, hasMultipleSpeakers } from '@/lib/text'
import clsx from 'clsx'

/* Fill Blank, v1 feel: type a word, Enter checks that one word.
   ✓ per blank, line breaks kept, each box sized to its word. */

type BlankState = 'open' | 'wrong' | 'correct' | 'retried' | 'revealed'

const LEVELS = [
  { id: 'easy', label: 'Easy', pct: 25, firstLetter: true },
  { id: 'medium', label: 'Medium', pct: 50, firstLetter: false },
  { id: 'hard', label: 'Hard', pct: 100, firstLetter: false },
] as const
type LevelId = typeof LEVELS[number]['id']

const REVEAL_AFTER = 3 // wrong tries before the word is shown

export function FillMode() {
  const { chunks, speakers } = useSkitContext()
  const [section, setSection] = useState('all')
  const [level, setLevel] = useState<LevelId>('easy')
  const [gen, setGen] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [states, setStates] = useState<Record<number, BlankState>>({})
  const [tries, setTries] = useState<Record<number, number>>({})
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({})
  const showSpeaker = hasMultipleSpeakers(speakers)
  const lvl = LEVELS.find(l => l.id === level)!

  const lines = useMemo(() => linesForSection(chunks, section), [chunks, section])

  // Tokens grouped by line; index = position in the flat token list
  const { tokens, byLine } = useMemo(() => {
    const tokens: Array<{ word: string; line: number }> = []
    const byLine: number[][] = []
    lines.forEach((l, li) => {
      byLine[li] = []
      l.text.split(/\s+/).filter(Boolean).forEach(w => {
        byLine[li].push(tokens.length)
        tokens.push({ word: w, line: li })
      })
    })
    return { tokens, byLine }
  }, [lines])

  const blanks = useMemo(() => {
    const minLetters = lvl.pct === 100 ? 1 : 3
    const eligible = tokens.map((_, i) => i).filter(i => letterCount(tokens[i].word) >= minLetters)
    if (lvl.pct === 100) return eligible
    const shuffled = [...eligible].sort(() => Math.random() - 0.5)
    const picked = new Set(shuffled.slice(0, Math.ceil(eligible.length * lvl.pct / 100)))
    return eligible.filter(i => picked.has(i))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens, lvl.pct, gen])
  const blankSet = useMemo(() => new Set(blanks), [blanks])

  const reset = () => { setAnswers({}); setStates({}); setTries({}) }
  const newBlanks = () => { setGen(g => g + 1); reset() }
  useEffect(reset, [section, level])

  const isDone = (i: number) => states[i] === 'correct' || states[i] === 'retried' || states[i] === 'revealed'
  const doneCount = blanks.filter(isDone).length
  const firstTry = blanks.filter(i => states[i] === 'correct').length
  const revealedCount = blanks.filter(i => states[i] === 'revealed').length
  const finished = blanks.length > 0 && doneCount === blanks.length

  const focusNext = (from: number) => {
    const pos = blanks.indexOf(from)
    for (let k = 1; k <= blanks.length; k++) {
      const next = blanks[(pos + k) % blanks.length]
      if (!isDone(next) && next !== from) { inputRefs.current[next]?.focus(); return }
    }
    inputRefs.current[from]?.blur()
  }

  const check = (i: number) => {
    const typed = answers[i] ?? ''
    if (!typed.trim()) { focusNext(i); return }
    if (normalizeWord(typed) === normalizeWord(tokens[i].word)) {
      setStates(s => ({ ...s, [i]: (tries[i] ?? 0) > 0 ? 'retried' : 'correct' }))
      focusNext(i)
      return
    }
    const n = (tries[i] ?? 0) + 1
    setTries(t => ({ ...t, [i]: n }))
    if (n >= REVEAL_AFTER) {
      setStates(s => ({ ...s, [i]: 'revealed' }))
      focusNext(i)
    } else {
      setStates(s => ({ ...s, [i]: 'wrong' }))
      inputRefs.current[i]?.select()
    }
  }

  const revealAll = () => {
    setStates(s => {
      const next = { ...s }
      blanks.forEach(i => { if (!isDone(i)) next[i] = 'revealed' })
      return next
    })
  }

  const placeholder = (i: number) => {
    const w = tokens[i].word
    if (lvl.firstLetter || (tries[i] ?? 0) >= 2) return firstLetterOf(w).replace(/[^\p{L}\p{N}]/gu, '')
    return ''
  }

  return (
    <div>
      <SectionChips chunks={chunks} value={section} onChange={setSection} />

      {/* Level + score */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="flex rounded-lg overflow-hidden border border-[var(--color-border)]">
          {LEVELS.map(l => (
            <button key={l.id} onClick={() => { setLevel(l.id); setGen(g => g + 1) }}
              className={clsx('px-3 py-1.5 text-xs font-semibold border-none cursor-pointer',
                level === l.id ? 'bg-[var(--color-green-main)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]')}>
              {l.label}
            </button>
          ))}
        </div>
        <span className="text-sm font-bold text-[var(--color-green-dark)] ml-auto">
          ✓ {doneCount} / {blanks.length}
        </span>
      </div>
      <div className="h-1 rounded-sm mb-4" style={{ background: 'var(--color-gray-200)' }}>
        <div className="h-1 rounded-sm transition-[width] duration-300"
          style={{ background: 'var(--color-green-main)', width: `${blanks.length ? (doneCount / blanks.length) * 100 : 0}%` }} />
      </div>

      {finished && (
        <div className="mb-4 p-3 rounded-xl border border-[var(--color-green-bright)] bg-[var(--color-green-faded)] text-sm">
          <strong className="text-[var(--color-green-dark)]">Done.</strong>{' '}
          {firstTry} first try · {doneCount - firstTry - revealedCount} after a retry · {revealedCount} shown
          <div className="flex gap-2 mt-2">
            <button onClick={newBlanks} className="px-3 py-1.5 rounded-lg border-none bg-[var(--color-green-main)] text-white text-xs font-semibold cursor-pointer">Again, new blanks</button>
            {level !== 'hard' && (
              <button onClick={() => { setLevel(level === 'easy' ? 'medium' : 'hard'); setGen(g => g + 1) }}
                className="px-3 py-1.5 rounded-lg border border-[var(--color-green-main)] bg-transparent text-[var(--color-green-dark)] text-xs font-semibold cursor-pointer">Harder</button>
            )}
          </div>
        </div>
      )}

      {/* The text, line by line */}
      <div>
        {lines.map((line, li) => (
          <div key={li} className={clsx('flex flex-wrap items-center gap-x-1.5 gap-y-1.5 mb-2', line.firstOfChunk && li > 0 && 'mt-5')}>
            {showSpeaker && line.speaker && (
              <span className="text-xs font-bold text-[var(--color-pink)]">{line.speaker}:</span>
            )}
            {byLine[li].map(i => {
              const t = tokens[i]
              if (!blankSet.has(i)) return <span key={i} className="text-base">{t.word}</span>
              const st = states[i] ?? 'open'
              const done = isDone(i)
              return (
                <span key={i} className="relative inline-block">
                  <input
                    ref={el => { inputRefs.current[i] = el }}
                    value={done && st === 'revealed' ? t.word : (answers[i] ?? '')}
                    readOnly={done}
                    onChange={e => {
                      setAnswers(a => ({ ...a, [i]: e.target.value }))
                      if (st === 'wrong') setStates(s => ({ ...s, [i]: 'open' }))
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); check(i) } }}
                    placeholder={placeholder(i)}
                    enterKeyHint="next"
                    autoCapitalize="off" autoCorrect="off" autoComplete="off" spellCheck={false}
                    style={{ width: `${Math.max(t.word.length, 2) + 1.5}ch` }}
                    className={clsx(
                      'px-1 py-0 rounded-md border-2 text-base text-center outline-none transition-colors',
                      'focus:border-[var(--color-green-main)]',
                      st === 'open' && 'border-[var(--color-gray-300)] bg-[var(--color-surface)]',
                      st === 'wrong' && 'border-[#EF4444] bg-[#FEE2E2] animate-shake',
                      (st === 'correct' || st === 'retried') && 'border-[var(--color-green-main)] bg-[var(--color-green-faded)] text-[var(--color-green-dark)]',
                      st === 'revealed' && 'border-[#F59E0B] bg-[#FEF3C7] text-[#92400E]',
                    )}
                  />
                  {(st === 'correct' || st === 'retried') && (
                    <span className="absolute -top-2 -right-1.5 text-[11px] font-bold text-[var(--color-green-main)]">✓</span>
                  )}
                </span>
              )
            })}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-5 text-xs">
        <button onClick={newBlanks} className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] cursor-pointer">New blanks</button>
        {!finished && blanks.length > 0 && (
          <button onClick={revealAll} className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] cursor-pointer">Show answers</button>
        )}
        <span className="ml-auto self-center text-[var(--color-text-muted)]">Enter checks a word · 3 misses shows it</span>
      </div>

      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  )
}
