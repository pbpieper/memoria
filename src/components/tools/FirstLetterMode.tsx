import { useState } from 'react'
import { useSkitContext } from '@/context/SkitContext'
import { SciencePanel } from '@/components/molecules/SciencePanel'
import { colors } from '@/design/tokens'
import { splitWords } from '@/lib/words'

export function FirstLetterMode() {
  const { flatLines } = useSkitContext()
  const [revealedLines, setRevealedLines] = useState<Set<number>>(new Set())

  // First letter, then a dot for every other letter, so each word shows its length too (v1 style):
  // "Here," → "H···,"  "l'argent" → "l'······". Punctuation stays as written.
  const getFL = (text: string) => splitWords(text).map(t => {
    let seen = false
    const word = t.word.replace(/[\p{L}\p{M}\p{N}]/gu, ch => (seen ? '·' : ((seen = true), ch)))
    return t.pre + word + t.post + (t.spaceAfter ? ' ' : '')
  }).join('').trimEnd()

  return (
    <div>
      <SciencePanel id="firstletter" />
      {flatLines.map((line, i) => {
        const isR = revealedLines.has(i)
        return (
          <div key={i}
            onClick={() => { const n = new Set(revealedLines); isR ? n.delete(i) : n.add(i); setRevealedLines(n) }}
            className="px-3 py-1.5 rounded-lg cursor-pointer mb-0.5 transition-all duration-150"
            style={{ background: isR ? colors.greenFaded : 'transparent' }}>
            <p className="m-0 text-[13px] leading-relaxed">
              <span className="font-bold" style={{ color: line.speaker === 'GUY' || line.speaker === 'PERFORMER' ? colors.greenDark : colors.pink }}>
                {line.speaker}:{' '}
              </span>
              <span className={isR ? undefined : 'font-mono'}>{isR ? line.text : getFL(line.text)}</span>
            </p>
          </div>
        )
      })}
    </div>
  )
}
