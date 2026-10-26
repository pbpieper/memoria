import { useState, useMemo, useRef } from 'react'
import { useSkitContext } from '@/context/SkitContext'
import { useCreativeHub } from '@/hooks/useCreativeHub'
import { SciencePanel } from '@/components/molecules/SciencePanel'
import { colors } from '@/design/tokens'
import type { FlatLine } from '@/types/skit'
import toast from 'react-hot-toast'
import { PRECISE_TYPING } from '@/lib/words'

export function CueMode() {
  const { flatLines, speakers } = useSkitContext()
  const { available, speak } = useCreativeHub()
  const [role, setRole] = useState(speakers[0])
  const [lineIdx, setLineIdx] = useState(0)
  const [showLine, setShowLine] = useState(false)
  const [input, setInput] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handleSpeak = async (text: string) => {
    if (speaking) { audioRef.current?.pause(); setSpeaking(false); return }
    setSpeaking(true)
    try {
      const url = await speak(text)
      if (audioRef.current) audioRef.current.pause()
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => setSpeaking(false)
      audio.play()
    } catch {
      toast.error('TTS unavailable')
      setSpeaking(false)
    }
  }

  const myLines = useMemo(() => {
    const result: Array<{ line: FlatLine; cue: FlatLine | null; globalIdx: number }> = []
    flatLines.forEach((line, i) => {
      if (line.speaker === role) {
        const cue = i > 0 ? flatLines[i - 1] : null
        result.push({ line, cue, globalIdx: i })
      }
    })
    return result
  }, [role, flatLines])

  const cur = myLines[lineIdx]
  const nav = (dir: number) => { setLineIdx(Math.max(0, Math.min(myLines.length - 1, lineIdx + dir))); setShowLine(false); setInput('') }

  return (
    <div>
      <SciencePanel id="cue" />
      {speakers.length > 1 ? (
        <div className="flex gap-2 mb-3.5">
          {speakers.map((sp, si) => (
            <button key={sp} onClick={() => { setRole(sp); setLineIdx(0); setShowLine(false); setInput('') }}
              className="px-5 py-2 rounded-xl border-none text-[13px] font-bold cursor-pointer"
              style={{ background: role === sp ? (si === 0 ? colors.greenMain : colors.pink) : colors.gray100, color: role === sp ? colors.white : colors.gray600 }}>
              {String.fromCharCode(65 + si)}: {sp}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--color-text-secondary)] mb-3.5">Solo piece — practice your delivery line by line.</p>
      )}
      {cur && (
        <div>
          <div className="text-xs text-[var(--color-text-secondary)] mb-2">Line {lineIdx + 1} of {myLines.length}</div>
          {cur.cue && (
            <div className="p-3.5 bg-[var(--color-surface-alt)] rounded-xl mb-2.5 border-l-[3px] border-[var(--color-gray-300)]">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] mb-0.5 uppercase">Cue ({cur.cue.speaker}):</p>
                  <p className="text-[var(--color-gray-700)] italic m-0 leading-relaxed">"{cur.cue.text}"</p>
                </div>
                {available && (
                  <button onClick={() => handleSpeak(cur.cue!.text)}
                    className="ml-2 px-2 py-1 rounded-md border border-[var(--color-gray-300)] bg-[var(--color-gray-100)] text-[10px] text-[var(--color-gray-600)] cursor-pointer shrink-0">
                    {speaking ? '⏹' : '🔊'} Hear
                  </button>
                )}
              </div>
            </div>
          )}
          <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={`Your line as ${role}...`} {...PRECISE_TYPING}
            className="w-full min-h-[70px] p-3 rounded-xl border-2 border-[var(--color-green-light)] text-[16px] resize-y outline-none mb-2" style={{ fontFamily: 'inherit' }} />
          <div className="flex gap-2">
            <button onClick={() => nav(-1)} disabled={lineIdx === 0}
              className="px-4 py-2 rounded-xl border-none bg-[var(--color-gray-100)] text-[var(--color-gray-600)] text-[13px] font-semibold cursor-pointer disabled:opacity-40">← Prev</button>
            <button onClick={() => setShowLine(!showLine)}
              className="px-4 py-2 rounded-xl border-none bg-[var(--color-pink)] text-white text-[13px] font-semibold cursor-pointer">
              {showLine ? 'Hide' : 'Reveal'}</button>
            <button onClick={() => nav(1)} disabled={lineIdx >= myLines.length - 1}
              className="px-4 py-2 rounded-xl border-none bg-[var(--color-green-main)] text-white text-[13px] font-semibold cursor-pointer disabled:opacity-40">Next →</button>
          </div>
          {showLine && (
            <div className="mt-2.5 p-3.5 bg-[var(--color-green-faded)] rounded-xl border-l-[3px] border-[var(--color-green-main)]">
              <div className="flex justify-between items-start">
                <p className="m-0 text-[var(--color-green-dark)] leading-relaxed">"{cur.line.text}"</p>
                {available && (
                  <button onClick={() => handleSpeak(cur.line.text)}
                    className="ml-2 px-2 py-1 rounded-md border border-[var(--color-green-light)] bg-[var(--color-green-faded)] text-[10px] text-[var(--color-green-dark)] cursor-pointer shrink-0">
                    🔊 Hear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
