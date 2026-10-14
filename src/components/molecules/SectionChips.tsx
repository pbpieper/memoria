import type { Chunk } from '@/types/skit'
import clsx from 'clsx'

export interface SectionLine {
  text: string
  speaker: string
  chunkId: number
  firstOfChunk: boolean
}

/** Lines of one section ('all' or a chunk id as string). */
export function linesForSection(chunks: Chunk[], section: string): SectionLine[] {
  const picked = section === 'all' ? chunks : chunks.filter(c => String(c.id) === section)
  return picked.flatMap(c => c.lines.map((l, i) => ({ text: l.text, speaker: l.speaker, chunkId: c.id, firstOfChunk: i === 0 })))
}

/** One row of chips: All · 1 · 2 · 3 … (label on hover / long-press). */
export function SectionChips({ chunks, value, onChange }: { chunks: Chunk[]; value: string; onChange: (s: string) => void }) {
  if (chunks.length <= 1) return null
  const current = chunks.find(c => String(c.id) === value)
  return (
    <div className="mb-3">
      <div className="flex gap-1 flex-wrap">
        {[{ id: 'all', label: 'All' }, ...chunks.map(c => ({ id: String(c.id), label: String(c.id), title: c.label }))].map(s => (
          <button key={s.id} onClick={() => onChange(s.id)} title={'title' in s ? s.title : undefined}
            className={clsx('min-w-[36px] px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer',
              value === s.id
                ? 'border-[var(--color-green-main)] bg-[var(--color-green-main)] text-white'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]')}>
            {s.label}
          </button>
        ))}
      </div>
      {current && <p className="text-xs text-[var(--color-text-muted)] mt-1.5 mb-0">{current.id}. {current.label}</p>}
    </div>
  )
}
