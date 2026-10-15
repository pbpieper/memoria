import { useState, useMemo } from 'react'
import { useSkitContext } from '@/context/SkitContext'
import { useApp } from '@/context/AppContext'
import { SectionChips, linesForSection } from '@/components/molecules/SectionChips'
import { lengthHint, hasMultipleSpeakers } from '@/lib/text'
import { colors } from '@/design/tokens'
import clsx from 'clsx'

export function FirstLetterMode() {
  const { chunks, speakers } = useSkitContext()
  const { section, setSection } = useApp()
  const [revealedLines, setRevealedLines] = useState<Set<number>>(new Set())
  const lines = useMemo(() => linesForSection(chunks, section), [chunks, section])
  const showSpeaker = hasMultipleSpeakers(speakers)

  // v1 style: the dots show each word's length too
  const toFirstLetters = (text: string) => text.split(/\s+/).map(lengthHint).join(' ')

  return (
    <div>
      <SectionChips chunks={chunks} value={section} onChange={s => { setSection(s); setRevealedLines(new Set()) }} />
      <p className="text-xs text-[var(--color-text-muted)] mb-3">Say each line from its first letters. Tap a line to check it.</p>
      {lines.map((line, i) => {
        const isR = revealedLines.has(i)
        return (
          <div key={i}
            onClick={() => { const n = new Set(revealedLines); if (isR) n.delete(i); else n.add(i); setRevealedLines(n) }}
            className={clsx('px-3 py-1.5 rounded-lg cursor-pointer mb-0.5 transition-all duration-150', line.firstOfChunk && i > 0 && 'mt-3')}
            style={{ background: isR ? colors.greenFaded : 'transparent' }}>
            <p className="m-0 text-base leading-relaxed">
              {showSpeaker && (
                <span className="font-bold" style={{ color: colors.pink }}>{line.speaker}:{' '}</span>
              )}
              <span className={clsx(!isR && 'font-mono break-words')}>{isR ? line.text : toFirstLetters(line.text)}</span>
            </p>
          </div>
        )
      })}
    </div>
  )
}
