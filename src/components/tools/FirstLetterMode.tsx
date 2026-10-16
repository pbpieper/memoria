import { useState } from 'react'
import { useSkitContext } from '@/context/SkitContext'
import { SciencePanel } from '@/components/molecules/SciencePanel'
import { colors } from '@/design/tokens'

export function FirstLetterMode() {
  const { flatLines } = useSkitContext()
  const [revealedLines, setRevealedLines] = useState<Set<number>>(new Set())

  const getFL = (text: string) => text.split(/\s+/).map(w => {
    const m = w.match(/^([^a-zA-Z]*)([a-zA-Z])/)
    if (!m) return w
    const rest = w.slice(m[0].length)
    const trailPunct = rest.match(/[^a-zA-Z]*$/)?.[0] || ''
    return m[1] + m[2] + trailPunct
  }).join(' ')

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
              {isR ? line.text : getFL(line.text)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
