import { useState, useMemo } from 'react'
import { useSkitContext } from '@/context/SkitContext'
import { useProgress } from '@/context/ProgressContext'
import { SciencePanel } from '@/components/molecules/SciencePanel'
import { colors } from '@/design/tokens'
import { wordsOf, PRECISE_TYPING } from '@/lib/words'
import clsx from 'clsx'

export function ChunkMode() {
  const { chunks, subChunksMap } = useSkitContext()
  const { progress, setProgress } = useProgress()
  const [active, setActive] = useState(0)
  const [phase, setPhase] = useState<'study' | 'test'>('study')
  const [userInput, setUserInput] = useState('')
  const [feedback, setFeedback] = useState<number | null>(null)
  const [useSubChunks, setUseSubChunks] = useState(false)
  const [subIdx, setSubIdx] = useState(0)

  const mastered = progress.chunkMastered
  const setMastered = (fn: (prev: Set<string>) => Set<string>) => setProgress(p => ({ ...p, chunkMastered: fn(p.chunkMastered) }))

  const chunk = chunks[active]
  const subs = subChunksMap[chunk.id] || []
  const hasSubs = subs.length > 1
  const currentItem = useSubChunks && hasSubs ? subs[subIdx] : chunk

  const check = () => {
    // Same words as Fill in the blank: punctuation left out, it's ≠ its, accents count
    const tWords = wordsOf(currentItem.lines.map(l => l.text).join(' '))
    const iWords = new Set(wordsOf(userInput))
    let matches = 0
    tWords.forEach(w => { if (iWords.has(w)) matches++ })
    const score = Math.round((matches / Math.max(1, tWords.length)) * 100)
    setFeedback(score)
    if (score >= 70) {
      if (useSubChunks && hasSubs) {
        setMastered(prev => {
          const n = new Set(prev)
          n.add(`${active}_${subIdx}`)
          const allDone = subs.every((_, si) => si === subIdx ? true : n.has(`${active}_${si}`))
          if (allDone) n.add(String(active))
          return n
        })
      } else {
        setMastered(prev => { const n = new Set(prev); n.add(String(active)); return n })
      }
    }
  }

  const switchChunk = (i: number) => { setActive(i); setPhase('study'); setUserInput(''); setFeedback(null); setSubIdx(0) }
  const masteredCount = Array.from(mastered).filter(k => !k.includes('_')).length

  return (
    <div>
      <SciencePanel id="chunk" />
      <div className="flex gap-1.5 flex-wrap mb-2.5">
        {chunks.map((c, i) => (
          <button key={c.id} onClick={() => switchChunk(i)}
            className={clsx('px-3 py-1.5 rounded-2xl border-2 text-[11px] font-semibold cursor-pointer transition-colors',
              i === active ? 'bg-[var(--color-pink)] text-white border-[var(--color-pink)]'
                : mastered.has(String(i)) ? 'bg-[var(--color-green-faded)] text-[var(--color-green-dark)] border-[var(--color-correct)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-gray-600)] border-[var(--color-border)]')}>
            {mastered.has(String(i)) ? '✓ ' : ''}{c.id}
          </button>
        ))}
      </div>

      {hasSubs && (
        <div className="mb-3">
          <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] cursor-pointer mb-1.5">
            <input type="checkbox" checked={useSubChunks} onChange={() => { setUseSubChunks(!useSubChunks); setSubIdx(0); setPhase('study'); setUserInput(''); setFeedback(null) }}
              style={{ accentColor: colors.pink }} />
            Break down ({subs.length} parts)
          </label>
          {useSubChunks && (
            <div className="flex gap-1">
              {subs.map((s, si) => (
                <button key={si} onClick={() => { setSubIdx(si); setPhase('study'); setUserInput(''); setFeedback(null) }}
                  className={clsx('px-2.5 py-1 rounded-lg border-2 text-[11px] font-semibold cursor-pointer',
                    si === subIdx ? 'border-[var(--color-pink)] bg-[var(--color-pink-faded)] text-[var(--color-pink-dark)]'
                      : mastered.has(`${active}_${si}`) ? 'border-[var(--color-correct)] bg-[var(--color-green-faded)] text-[var(--color-green-dark)]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]')}>
                  {chunk.id}{s.subId}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {phase === 'study' ? (
        <div>
          <div className="p-4 bg-[var(--color-surface-alt)] rounded-xl mb-3">
            {currentItem.lines.map((line, i) => (
              <p key={i} className="mb-1">
                <span className="font-bold text-xs" style={{ color: line.speaker === 'GUY' || line.speaker === 'PERFORMER' ? colors.greenDark : colors.pink }}>{line.speaker}:</span>{' '}
                <span className="text-[var(--color-text-primary)] leading-relaxed">{line.text}</span>
              </p>
            ))}
          </div>
          <button onClick={() => { setPhase('test'); setUserInput(''); setFeedback(null) }}
            className="px-6 py-2.5 rounded-xl border-none bg-[var(--color-green-main)] text-white text-sm font-bold cursor-pointer">
            Hide & test me →
          </button>
        </div>
      ) : (
        <div>
          <div className="p-6 bg-[var(--color-gray-900)] rounded-xl mb-3 text-center">
            <p className="text-white text-base font-semibold m-0">
              {useSubChunks && hasSubs ? `Chunk ${chunk.id}${subs[subIdx].subId}` : `Chunk ${chunk.id}`}: {chunk.label}
            </p>
          </div>
          <textarea value={userInput} onChange={e => setUserInput(e.target.value)} placeholder="Type from memory..." {...PRECISE_TYPING}
            className="w-full min-h-[100px] p-3.5 rounded-xl border-2 border-[var(--color-green-light)] text-[16px] resize-y outline-none" style={{ fontFamily: 'inherit' }} />
          <div className="flex gap-2 mt-2.5">
            <button onClick={check} className="px-5 py-2 rounded-xl border-none bg-[var(--color-pink)] text-white text-[13px] font-bold cursor-pointer">Check</button>
            <button onClick={() => setPhase('study')} className="px-5 py-2 rounded-xl border-none bg-[var(--color-gray-200)] text-[var(--color-gray-700)] text-[13px] font-semibold cursor-pointer">Show text</button>
          </div>
          {feedback !== null && (
            <div className={clsx('mt-2.5 p-3 rounded-xl text-[13px]', feedback >= 70 ? 'bg-[var(--color-green-faded)] text-[var(--color-green-dark)]' : 'bg-[var(--color-pink-faded)] text-[var(--color-pink-dark)]')}>
              <strong>{feedback}%.</strong> {feedback >= 85 ? 'Locked in.' : feedback >= 70 ? 'Good — keep refining.' : 'Study it again, read aloud, then retry.'}
            </div>
          )}
        </div>
      )}

      <div className="mt-3.5 flex items-center gap-2">
        <div className="flex-1 h-1 bg-[var(--color-gray-200)] rounded-full">
          <div className="h-1 bg-[var(--color-green-main)] rounded-full transition-[width] duration-300" style={{ width: `${(masteredCount / chunks.length) * 100}%` }} />
        </div>
        <span className="text-[11px] text-[var(--color-text-secondary)]">{masteredCount}/{chunks.length}</span>
      </div>
    </div>
  )
}
