import { useState, useMemo } from 'react'
import { useSkitContext } from '@/context/SkitContext'
import { SciencePanel } from '@/components/molecules/SciencePanel'
import { SectionSelect } from '@/components/molecules/SectionSelect'
import { getLinesForSection } from '@/lib/helpers'
import { colors } from '@/design/tokens'
import clsx from 'clsx'

const HINT_TYPES = [
  { id: 'firstletter', label: 'First Letter', icon: '🔤', desc: 'Shows first letter of each word' },
  { id: 'scene', label: 'Scene Description', icon: '🎬', desc: 'Shows chunk visual/anchor' },
  { id: 'palace', label: 'Palace Image', icon: '🏛️', desc: 'Shows memory palace image' },
  { id: 'none', label: 'No Hints', icon: '💀', desc: 'Pure recall' },
]

export function FreeWriteMode() {
  const { chunks, flatLines, macroSections, palaceImages } = useSkitContext()
  const [section, setSection] = useState('all')
  const [hintType, setHintType] = useState('scene')
  const [userText, setUserText] = useState('')
  const [checked, setChecked] = useState(false)
  const [showDiff, setShowDiff] = useState(false)

  const lines = useMemo(() => getLinesForSection(section, flatLines, macroSections, chunks), [section, flatLines, macroSections, chunks])
  const fullText = lines.map(l => l.text).join(' ')

  const sceneHints = useMemo(() => {
    const chunkIds = [...new Set(lines.map(l => l.chunkId))]
    return chunkIds.map(cid => {
      const chunk = chunks.find(c => c.id === cid)
      if (!chunk) return null
      return { id: cid, label: chunk.label, image: palaceImages[cid - 1] }
    }).filter(Boolean)
  }, [lines, chunks, palaceImages])

  const score = useMemo(() => {
    if (!checked) return null
    const targetWords = fullText.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean)
    const userWords = userText.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean)
    const userSet = new Set(userWords)
    let hits = 0
    targetWords.forEach(w => { if (userSet.has(w)) hits++ })
    let lcsLen = 0, j = 0
    for (let i = 0; i < targetWords.length && j < userWords.length; i++) {
      if (targetWords[i] === userWords[j]) { lcsLen++; j++ }
      else { const ahead = targetWords.indexOf(userWords[j], i); if (ahead !== -1) { i = ahead; lcsLen++; j++ } }
    }
    return { wordMatch: Math.round((hits / targetWords.length) * 100), sequenceMatch: Math.round((lcsLen / targetWords.length) * 100), targetCount: targetWords.length, userCount: userWords.length }
  }, [checked, fullText, userText])

  const diffLines = useMemo(() => {
    if (!showDiff) return null
    return lines.map(line => {
      const targetWords = line.text.split(/\s+/)
      const userLower = userText.toLowerCase().replace(/[^a-z0-9\s]/g, '')
      return { speaker: line.speaker, words: targetWords.map(w => ({ word: w, found: userLower.includes(w.toLowerCase().replace(/[^a-z0-9]/g, '')) })) }
    })
  }, [showDiff, lines, userText])

  const reset = () => { setUserText(''); setChecked(false); setShowDiff(false) }

  return (
    <div>
      <SciencePanel id="fill" />
      <p className="text-xs text-[var(--color-text-secondary)] mb-1">Write the entire section from memory. No blanks, no scaffolding — just you and the page.</p>
      <p className="text-[11px] text-[var(--color-text-muted)] mb-3">Choose your hint level below.</p>

      <SectionSelect value={section} onChange={s => { setSection(s); reset() }} macroSections={macroSections} chunks={chunks} />

      <div className="flex gap-1 flex-wrap mt-2.5 mb-3.5 items-center">
        <span className="text-xs text-[var(--color-text-secondary)]">Hint:</span>
        {HINT_TYPES.map(h => (
          <button key={h.id} onClick={() => setHintType(h.id)} title={h.desc}
            className={clsx('px-2.5 py-1 rounded-md border text-[11px] cursor-pointer',
              hintType === h.id ? 'border-[var(--color-green-main)] bg-[var(--color-green-faded)] text-[var(--color-green-dark)] font-bold' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]')}>
            {h.icon} {h.label}
          </button>
        ))}
      </div>

      {hintType === 'firstletter' && (
        <div className="mb-3 p-3 bg-[var(--color-green-pale)] rounded-xl">
          <p className="text-[11px] font-bold text-[var(--color-green-dark)] mb-1">First Letters:</p>
          {lines.map((line, i) => (
            <p key={i} className="text-xs text-[var(--color-gray-600)] mb-0.5 font-mono tracking-wide">
              <span className="font-bold" style={{ color: line.speaker === 'GUY' || line.speaker === 'PERFORMER' ? colors.greenDark : colors.pink }}>{line.speaker}: </span>
              {line.text.split(/\s+/).map(w => { const m = w.match(/^[^a-zA-Z]*([a-zA-Z])/); return m ? m[1] : w }).join(' ')}
            </p>
          ))}
        </div>
      )}

      {(hintType === 'scene' || hintType === 'palace') && sceneHints.length > 0 && (
        <div className="mb-3 p-3 bg-[var(--color-green-pale)] rounded-xl border border-[var(--color-green-bright)]">
          {sceneHints.map(s => s && (
            <div key={s.id} className="mb-2">
              {hintType === 'palace' && s.image && (
                <div className="rounded-lg overflow-hidden h-20 mb-1.5">
                  <img src={s.image} alt={s.label} className="w-full h-full object-cover opacity-70" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}
              <p className="text-[11px] font-bold text-[var(--color-green-dark)] mb-0.5">{s.id}. {s.label}</p>
            </div>
          ))}
        </div>
      )}

      <textarea value={userText} onChange={e => { setUserText(e.target.value); if (checked) { setChecked(false); setShowDiff(false) } }}
        placeholder="Start writing from memory..."
        className="w-full min-h-[180px] p-4 rounded-xl border-2 text-sm resize-y outline-none leading-relaxed"
        style={{ borderColor: checked ? (score && score.wordMatch >= 70 ? colors.correct : colors.incorrect) : colors.greenLight, fontFamily: 'inherit' }}
      />

      <div className="flex gap-2 mt-2.5">
        <button onClick={() => setChecked(true)} className="px-5 py-2 rounded-xl border-none bg-[var(--color-pink)] text-white text-[13px] font-bold cursor-pointer">Check</button>
        {checked && (
          <button onClick={() => setShowDiff(!showDiff)}
            className={clsx('px-5 py-2 rounded-xl border-none text-[13px] font-semibold cursor-pointer',
              showDiff ? 'bg-[var(--color-green-main)] text-white' : 'bg-[var(--color-gray-200)] text-[var(--color-gray-700)]')}>
            {showDiff ? 'Hide Diff' : 'Show Diff'}
          </button>
        )}
        <button onClick={reset} className="px-5 py-2 rounded-xl border-none bg-[var(--color-gray-200)] text-[var(--color-gray-700)] text-[13px] font-semibold cursor-pointer">Clear</button>
      </div>

      {score && (
        <div className={clsx('mt-3 p-3.5 rounded-xl border', score.wordMatch >= 70 ? 'bg-[var(--color-green-faded)] border-[var(--color-green-bright)]' : 'bg-[var(--color-pink-faded)] border-[var(--color-pink-mid)]')}>
          <div className="flex gap-4 mb-1.5 text-[13px]">
            <span className="font-bold" style={{ color: score.wordMatch >= 70 ? colors.greenDark : colors.pinkDark }}>Words: {score.wordMatch}%</span>
            <span className="font-bold" style={{ color: score.sequenceMatch >= 60 ? colors.greenDark : colors.pinkDark }}>Order: {score.sequenceMatch}%</span>
            <span className="text-[var(--color-text-secondary)]">{score.userCount}/{score.targetCount} words</span>
          </div>
          <p className="text-xs text-[var(--color-gray-600)] m-0">
            {score.wordMatch >= 85 ? 'Nearly perfect recall.' : score.wordMatch >= 70 ? 'Strong — tighten specific word choices.' : score.wordMatch >= 50 ? 'Good foundation — focus on the gaps.' : 'Keep studying — try scene hints or go back to chunks.'}
          </p>
        </div>
      )}

      {diffLines && (
        <div className="mt-3 p-3.5 bg-[var(--color-surface-alt)] rounded-xl border border-[var(--color-border)]">
          <p className="text-[11px] font-bold text-[var(--color-text-secondary)] mb-2">Word-by-word diff (green = you got it, red = missing):</p>
          {diffLines.map((dl, i) => (
            <p key={i} className="mb-1 leading-relaxed text-[13px]">
              <span className="font-bold text-[11px]" style={{ color: dl.speaker === 'GUY' || dl.speaker === 'PERFORMER' ? colors.greenDark : colors.pink }}>{dl.speaker}: </span>
              {dl.words.map((w, wi) => (
                <span key={wi} className="px-0.5 rounded mx-px" style={{ background: w.found ? '#DCFCE7' : '#FEE2E2', color: w.found ? colors.greenDark : colors.incorrect }}>
                  {w.word}
                </span>
              ))}{' '}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
