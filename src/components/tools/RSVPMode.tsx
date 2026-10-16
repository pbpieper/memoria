import { useState, useMemo, useEffect, useRef } from 'react'
import { useSkitContext } from '@/context/SkitContext'
import { SciencePanel } from '@/components/molecules/SciencePanel'
import { SectionSelect } from '@/components/molecules/SectionSelect'
import { getLinesForSection } from '@/lib/helpers'
import { colors } from '@/design/tokens'
import clsx from 'clsx'

const WPM_PRESETS = [100, 200, 300, 450, 600, 900, 1324]

export function RSVPMode() {
  const { flatLines, macroSections, chunks } = useSkitContext()
  const [wpm, setWpm] = useState(250)
  const [isPlaying, setIsPlaying] = useState(false)
  const [wordIdx, setWordIdx] = useState(0)
  const [section, setSection] = useState('all')
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textRef = useRef<HTMLDivElement>(null)

  const words = useMemo(() => {
    const lines = getLinesForSection(section, flatLines, macroSections, chunks)
    const result: Array<{ text: string; isSpeaker: boolean; speaker: string }> = []
    lines.forEach(line => {
      result.push({ text: `${line.speaker}:`, isSpeaker: true, speaker: line.speaker })
      line.text.split(/\s+/).forEach(w => result.push({ text: w, isSpeaker: false, speaker: line.speaker }))
    })
    return result
  }, [section, flatLines, macroSections, chunks])

  useEffect(() => {
    if (isPlaying) {
      const cur = words[wordIdx]
      const baseDelay = 60000 / wpm
      const delay = cur?.isSpeaker ? baseDelay * 3 : /[.!?;—]$/.test(cur?.text || '') ? baseDelay * 2 : baseDelay
      intervalRef.current = setTimeout(() => {
        setWordIdx(prev => { if (prev + 1 >= words.length) { setIsPlaying(false); return prev } return prev + 1 })
      }, delay)
    }
    return () => { if (intervalRef.current) clearTimeout(intervalRef.current) }
  }, [isPlaying, wordIdx, wpm, words])

  useEffect(() => {
    const el = textRef.current?.querySelector(`[data-wi="${wordIdx}"]`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [wordIdx])

  // Space bar to toggle play
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault()
        setIsPlaying(p => !p)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const cur = words[wordIdx] || { text: '—', isSpeaker: false }
  const findORP = (w: string) => { const l = w.length; if (l <= 1) return 0; if (l <= 3) return 1; if (l <= 5) return 2; return Math.floor(l * 0.4) }
  const orp = findORP(cur.text)
  const progress = words.length > 1 ? (wordIdx / (words.length - 1)) * 100 : 0
  const remaining = Math.round((words.length - wordIdx) / wpm * 60)

  return (
    <div>
      <SciencePanel id="rsvp" />
      <div className="flex gap-2.5 flex-wrap mb-3.5 items-center">
        <SectionSelect value={section} onChange={v => { setSection(v); setWordIdx(0); setIsPlaying(false) }} macroSections={macroSections} chunks={chunks} />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[var(--color-text-secondary)]">WPM:</span>
          <input type="range" min={60} max={1324} step={10} value={wpm} onChange={e => setWpm(Number(e.target.value))} className="w-[120px]" style={{ accentColor: colors.pink }} />
          <span className="text-sm font-bold min-w-[48px]" style={{ color: colors.pink }}>{wpm}</span>
        </div>
      </div>
      <div className="flex gap-1 mb-3.5 flex-wrap">
        {WPM_PRESETS.map(w => (
          <button key={w} onClick={() => setWpm(w)}
            className={clsx('px-2 py-0.5 rounded-md border text-[10px] cursor-pointer',
              wpm === w ? 'border-[var(--color-pink)] bg-[var(--color-pink-faded)] text-[var(--color-pink-dark)] font-bold' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]')}>
            {w}
          </button>
        ))}
      </div>
      {/* RSVP display */}
      <div className="bg-[var(--color-surface)] border-[3px] border-[var(--color-green-main)] rounded-2xl py-10 px-5 min-h-[160px] flex items-center justify-center relative mb-3">
        <div className="absolute left-[40%] top-0 bottom-0 w-0.5 opacity-25" style={{ background: colors.pink }} />
        <div className="flex items-baseline">
          <span className="font-mono text-[38px] font-bold text-right min-w-[100px]" style={{ color: colors.greenDark }}>{cur.text.slice(0, orp)}</span>
          <span className="font-mono text-[38px] font-black" style={{ color: colors.pink }}>{cur.text[orp] || ''}</span>
          <span className="font-mono text-[38px] font-bold text-left min-w-[100px]" style={{ color: colors.greenDark }}>{cur.text.slice(orp + 1)}</span>
        </div>
      </div>
      {/* Controls */}
      <div className="flex gap-2 justify-center mb-2.5">
        <button onClick={() => setWordIdx(Math.max(0, wordIdx - 1))} className="w-10 h-10 rounded-lg border-none bg-[var(--color-gray-100)] text-base cursor-pointer">◀</button>
        <button onClick={() => { if (isPlaying) setIsPlaying(false); else { if (wordIdx >= words.length - 1) setWordIdx(0); setIsPlaying(true) } }}
          className="w-14 h-10 rounded-lg border-none text-white text-base font-bold cursor-pointer"
          style={{ background: isPlaying ? colors.pink : colors.greenMain }}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={() => { setIsPlaying(false); setWordIdx(0) }} className="w-10 h-10 rounded-lg border-none bg-[var(--color-gray-100)] text-base cursor-pointer">↻</button>
        <button onClick={() => setWordIdx(Math.min(words.length - 1, wordIdx + 1))} className="w-10 h-10 rounded-lg border-none bg-[var(--color-gray-100)] text-base cursor-pointer">▶</button>
      </div>
      {/* Progress */}
      <div className="h-1.5 bg-[var(--color-gray-200)] rounded mb-1.5">
        <div className="h-1.5 rounded transition-[width] duration-100" style={{ background: colors.greenMain, width: `${progress}%` }} />
      </div>
      <div className="flex justify-between text-[11px] text-[var(--color-text-secondary)] mb-3.5">
        <span>{Math.round(progress)}%</span>
        <span>{Math.floor(remaining / 60)}:{(remaining % 60).toString().padStart(2, '0')} remaining</span>
      </div>
      {/* Text view */}
      <div ref={textRef} className="p-3.5 bg-[var(--color-surface-alt)] rounded-xl max-h-[200px] overflow-y-auto leading-loose text-[13px]">
        {words.map((w, i) => (
          <span key={i} data-wi={i} onClick={() => { setWordIdx(i); setIsPlaying(false) }}
            className="cursor-pointer px-0.5 rounded transition-all duration-100"
            style={{
              color: i < wordIdx ? colors.gray300 : i === wordIdx ? colors.white : 'var(--color-gray-700)',
              background: i === wordIdx ? colors.pink : 'transparent',
              fontWeight: w.isSpeaker ? 700 : 400,
            }}>
            {w.text}{' '}
          </span>
        ))}
      </div>
    </div>
  )
}
