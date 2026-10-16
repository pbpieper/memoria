import { useState, useMemo, useRef, useCallback } from 'react'
import { useSkitContext } from '@/context/SkitContext'
import { SciencePanel } from '@/components/molecules/SciencePanel'
import { GranularitySelector } from '@/components/molecules/GranularitySelector'
import { getLinesForGranularity } from '@/lib/helpers'
import { colors } from '@/design/tokens'
import clsx from 'clsx'

type AttemptStatus = 'unanswered' | 'wrong-first' | 'wrong-second' | 'revealed' | 'correct'

const HINT_TYPES = [
  { id: 'wordcount', label: 'Word Length', desc: 'Shows character count per blank', icon: '#️⃣' },
  { id: 'firstletter', label: 'First Letter', desc: 'Shows first letter of each blank', icon: '🔤' },
  { id: 'scene', label: 'Scene Description', desc: 'Shows chunk visual/anchor as hint', icon: '🎬' },
  { id: 'palace', label: 'Palace Image', desc: 'Shows memory palace image for the section', icon: '🏛️' },
  { id: 'none', label: 'No Hints', desc: 'Pure recall — nothing to help you', icon: '💀' },
]

const DIFFICULTY_PRESETS = [
  { id: 'guided', label: 'Guided', pct: 20, hint: 'firstletter', desc: '20% blanks + first letters' },
  { id: 'moderate', label: 'Moderate', pct: 50, hint: 'wordcount', desc: '50% blanks + word length' },
  { id: 'hard', label: 'Hard', pct: 80, hint: 'scene', desc: '80% blanks + scene hint only' },
  { id: 'brutal', label: 'Brutal', pct: 100, hint: 'none', desc: '100% blanks, no hints' },
  { id: 'custom', label: 'Custom', pct: null, hint: null, desc: 'Your settings' },
]

const PCT_PRESETS = [10, 20, 30, 50, 70, 85, 100]

export function FillMode() {
  const { chunks, flatLines, macroSections, mesoSections, microSections, palaceImages } = useSkitContext()
  const [granularity, setGranularity] = useState('macro')
  const [section, setSection] = useState('all')
  const [pct, setPct] = useState(30)
  const [hintType, setHintType] = useState('wordcount')
  const [difficulty, setDifficulty] = useState('custom')
  const [gen, setGen] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [checked, setChecked] = useState(false)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [attemptCounts, setAttemptCounts] = useState<Record<number, number>>({})
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const lines = useMemo(() => getLinesForGranularity(granularity, section, flatLines, macroSections), [granularity, section, flatLines, macroSections])

  const tokens = useMemo(() => {
    const result: Array<{ word: string; lineIdx: number; wordIdx: number; speaker: string; chunkId: number }> = []
    lines.forEach((line, li) => {
      line.text.split(/\s+/).forEach((w, wi) => {
        result.push({ word: w, lineIdx: li, wordIdx: wi, speaker: line.speaker, chunkId: line.chunkId })
      })
    })
    return result
  }, [lines])

  const blankSet = useMemo(() => {
    if (pct === 100) return new Set(tokens.map((_, i) => i))
    const eligible = tokens.map((_, i) => i).filter(i => tokens[i].word.replace(/[^a-zA-Z]/g, '').length > 2)
    const shuffled = [...eligible].sort(() => Math.random() - 0.5)
    return new Set(shuffled.slice(0, Math.ceil(eligible.length * (pct / 100))))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens, pct, gen])

  const blankKeys = useMemo(() => tokens.map((_, i) => i).filter(i => blankSet.has(i)), [tokens, blankSet])

  const normalize = (s: string) => (s || '').trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  const isCorrect = (idx: number) => normalize(tokens[idx].word) === normalize(answers[idx] || '')

  const getAttemptStatus = (idx: number): AttemptStatus => {
    if (revealed.has(idx)) return 'revealed'
    if (!checked) return 'unanswered'
    if (!answers[idx]) return 'unanswered'
    if (isCorrect(idx)) return 'correct'
    const attempts = attemptCounts[idx] || 0
    return attempts >= 1 ? 'wrong-second' : 'wrong-first'
  }

  const handleRetry = (idx: number) => {
    const attempts = attemptCounts[idx] || 0
    if (attempts === 0) {
      setAttemptCounts(c => ({ ...c, [idx]: 1 }))
      setAnswers(a => ({ ...a, [idx]: '' }))
    } else if (attempts === 1) {
      setRevealed(r => new Set([...r, idx]))
    }
  }

  const regenerate = () => { setGen(g => g + 1); setAnswers({}); setChecked(false); setRevealed(new Set()); setAttemptCounts({}) }

  const handleGranularityChange = (g: string) => { setGranularity(g); regenerate() }
  const handleSectionChange = (s: string) => { setSection(s); regenerate() }

  const handleKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      const curPos = blankKeys.indexOf(idx)
      const nextIdx = blankKeys[(curPos + 1) % blankKeys.length]
      inputRefs.current[nextIdx]?.focus()
    }
  }

  const stats = useMemo(() => {
    if (!checked) return null
    let correct = 0, wrong = 0, revealed_count = 0
    blankKeys.forEach(idx => {
      if (revealed.has(idx)) { revealed_count++; return }
      if (answers[idx] && isCorrect(idx)) correct++
      else if (answers[idx]) wrong++
    })
    return { correct, wrong, revealed: revealed_count, total: blankKeys.length }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, answers, blankKeys, revealed])

  const applyDifficulty = (d: typeof DIFFICULTY_PRESETS[number]) => {
    setDifficulty(d.id)
    if (d.pct !== null) setPct(d.pct)
    if (d.hint !== null) setHintType(d.hint)
    regenerate()
  }

  const getHint = (idx: number) => {
    const t = tokens[idx]
    if (hintType === 'wordcount') return `${t.word.length}`
    if (hintType === 'firstletter') return t.word.charAt(0)
    return '·'
  }

  const sceneHint = useMemo(() => {
    if (hintType !== 'scene' && hintType !== 'palace') return null
    const chunkIds = [...new Set(lines.map(l => l.chunkId))]
    return chunkIds.map(cid => {
      const chunk = chunks.find(c => c.id === cid)
      if (!chunk) return null
      return { id: cid, label: chunk.label, image: palaceImages[cid - 1] }
    }).filter(Boolean)
  }, [hintType, lines, chunks, palaceImages])

  return (
    <div>
      <SciencePanel id="fill" />
      <GranularitySelector granularity={granularity as 'macro' | 'meso' | 'micro'} setGranularity={handleGranularityChange}
        section={section} setSection={handleSectionChange}
        macroSections={macroSections} mesoSections={mesoSections} microSections={microSections} />

      {/* Difficulty Presets */}
      <div className="flex gap-1 flex-wrap mb-2.5">
        {DIFFICULTY_PRESETS.map(d => (
          <button key={d.id} onClick={() => applyDifficulty(d)} title={d.desc}
            className={clsx('px-2.5 py-1 rounded-lg border text-[11px] cursor-pointer transition-colors',
              difficulty === d.id ? 'border-[var(--color-pink)] bg-[var(--color-pink-faded)] text-[var(--color-pink-dark)] font-bold' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] font-medium')}>
            {d.label}
          </button>
        ))}
      </div>

      {/* Blank % controls */}
      <div className="flex gap-2.5 flex-wrap mb-2.5 items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[var(--color-text-secondary)]">Blanks:</span>
          <input type="range" min={10} max={100} step={5} value={pct}
            onChange={e => { setPct(Number(e.target.value)); setDifficulty('custom') }}
            className="w-24" style={{ accentColor: colors.pink }} />
          <span className="text-[13px] font-bold text-[var(--color-pink)] min-w-[38px]">{pct}%</span>
        </div>
        <div className="flex gap-0.5">
          {PCT_PRESETS.map(p => (
            <button key={p} onClick={() => { setPct(p); setDifficulty('custom') }}
              className={clsx('px-1.5 py-0.5 rounded-md border text-[10px] cursor-pointer',
                pct === p ? 'border-[var(--color-pink)] bg-[var(--color-pink-faded)] text-[var(--color-pink-dark)] font-bold' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]')}>
              {p}%
            </button>
          ))}
        </div>
      </div>

      {/* Hint type */}
      <div className="flex gap-1 flex-wrap mb-2.5 items-center">
        <span className="text-xs text-[var(--color-text-secondary)]">Hint:</span>
        {HINT_TYPES.map(h => (
          <button key={h.id} onClick={() => { setHintType(h.id); setDifficulty('custom') }} title={h.desc}
            className={clsx('px-2 py-0.5 rounded-md border text-[10px] cursor-pointer',
              hintType === h.id ? 'border-[var(--color-green-main)] bg-[var(--color-green-faded)] text-[var(--color-green-dark)] font-bold' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]')}>
            {h.icon} {h.label}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-3.5">
        <button onClick={regenerate} className="px-3.5 py-1.5 rounded-lg border-none bg-[var(--color-green-main)] text-white text-xs font-semibold cursor-pointer">Regenerate</button>
        <button onClick={() => setChecked(true)} className="px-3.5 py-1.5 rounded-lg border-none bg-[var(--color-pink)] text-white text-xs font-semibold cursor-pointer">Check All</button>
      </div>

      {/* Scene/Palace hints */}
      {sceneHint && sceneHint.length > 0 && (
        <div className="mb-3 p-3 bg-[var(--color-green-pale)] rounded-xl border border-[var(--color-green-bright)]">
          {sceneHint.map(s => s && (
            <div key={s.id} className="mb-2">
              {hintType === 'palace' && s.image && (
                <div className="rounded-lg overflow-hidden h-20 mb-1.5">
                  <img src={s.image} alt={s.label} className="w-full h-full object-cover opacity-70" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}
              <p className="text-[11px] font-bold text-[var(--color-green-dark)] mb-0.5">Chunk {s.id}: {s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {stats && (
        <div className="p-3 bg-[var(--color-green-faded)] rounded-xl border border-[var(--color-green-bright)] text-xs mb-3">
          <strong className="text-[var(--color-green-dark)]">Results:</strong> {stats.correct} correct, {stats.wrong} wrong, {stats.revealed} revealed ({Math.round((stats.correct / stats.total) * 100)}%)
        </div>
      )}

      {/* Fill blanks area */}
      <div className="mt-3.5 p-3.5 bg-[var(--color-surface-alt)] rounded-xl max-h-[300px] overflow-y-auto">
        <div className="flex flex-wrap gap-0.5">
          {tokens.map((t, i) => {
            const isBlanked = blankSet.has(i)
            const answer = answers[i]
            const isRev = revealed.has(i)
            const status = getAttemptStatus(i)

            let bgColor = 'var(--color-surface)'
            let borderColor = 'border-[var(--color-gray-300)]'
            let disabled = false

            if (isRev) {
              bgColor = 'var(--color-green-faded)'
              borderColor = 'border-[var(--color-green-main)]'
              disabled = true
            } else if (checked && answer && isCorrect(i)) {
              bgColor = 'var(--color-green-faded)'
              borderColor = 'border-[var(--color-green-main)]'
              disabled = true
            } else if (checked && answer && !isCorrect(i)) {
              bgColor = '#FEE2E2'
              borderColor = status === 'wrong-second' ? 'border-[var(--color-pink)]' : 'border-[#EF4444]'
            }

            return (
              <div key={i} className="inline-block mr-0.5 mb-0.5 relative group">
                {isBlanked ? (
                  <>
                    <input
                      ref={el => { inputRefs.current[i] = el }}
                      type="text"
                      value={isRev ? t.word : (answer || '')}
                      onChange={e => !disabled && setAnswers(a => ({ ...a, [i]: e.target.value }))}
                      onKeyDown={e => handleKey(e, i)}
                      placeholder={getHint(i)}
                      disabled={disabled}
                      className={clsx(
                        'w-[45px] px-1 py-0.5 rounded border text-[11px] text-center outline-none transition-all',
                        borderColor,
                        disabled && 'cursor-not-allowed opacity-70',
                        status === 'wrong-first' && checked && 'animate-shake'
                      )}
                      style={{ background: bgColor }}
                    />
                    {/* Retry button for wrong answers */}
                    {checked && answer && !isCorrect(i) && (
                      <button
                        onClick={() => handleRetry(i)}
                        className={clsx(
                          'absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity',
                          'text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border',
                          status === 'wrong-first'
                            ? 'border-[#EF4444] text-[#EF4444] hover:bg-[#FEE2E2]'
                            : 'border-[var(--color-pink)] text-[var(--color-pink)] hover:bg-[var(--color-pink-faded)]'
                        )}
                      >
                        {status === 'wrong-first' ? 'Retry' : 'Reveal'}
                      </button>
                    )}
                  </>
                ) : (
                  <span className="px-1 py-0.5 text-[11px] text-[var(--color-gray-600)]">{t.word}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Add CSS for shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}
