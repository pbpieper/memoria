import type { Skit, Chunk, Line, MacroSection } from '@/types/skit'

interface ParseOptions {
  title?: string
  subtitle?: string
  speakers?: string[]
}

const SPEAKER_PATTERN = /^([A-Z][A-Z0-9 _]+):\s*/

export function parseSkitFromText(raw: string, options?: ParseOptions): Omit<Skit, 'id' | 'createdAt' | 'updatedAt'> {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  const speakersSet = new Set<string>()
  const parsedLines: Line[] = []

  for (const line of lines) {
    const match = line.match(SPEAKER_PATTERN)
    if (match) {
      const speaker = match[1]
      const text = line.slice(match[0].length).trim()
      speakersSet.add(speaker)
      parsedLines.push({ speaker, text })
    } else {
      const speaker = options?.speakers?.[0] ?? 'PERFORMER'
      speakersSet.add(speaker)
      parsedLines.push({ speaker, text: line })
    }
  }

  // Group into chunks by blank-line-separated paragraphs in original
  const paragraphs = raw.split(/\n\s*\n/).filter(p => p.trim())
  const chunks: Chunk[] = []
  let lineIdx = 0

  for (let i = 0; i < paragraphs.length; i++) {
    const paraLines = paragraphs[i].split('\n').map(l => l.trim()).filter(Boolean)
    const chunkLines: Line[] = []
    for (const _ of paraLines) {
      if (lineIdx < parsedLines.length) {
        chunkLines.push(parsedLines[lineIdx++])
      }
    }
    if (chunkLines.length > 0) {
      chunks.push({
        id: i + 1,
        label: `Part ${i + 1}`,
        lines: chunkLines,
      })
    }
  }

  // If no paragraph breaks found, put all lines in one chunk
  if (chunks.length === 0 && parsedLines.length > 0) {
    chunks.push({ id: 1, label: 'Part 1', lines: parsedLines })
  }

  const speakers = options?.speakers ?? [...speakersSet]

  // Auto-generate macro sections
  const allChunkIds = chunks.map(c => c.id)
  const macroSections: MacroSection[] = [
    { id: 'all', label: 'Full Script', chunks: allChunkIds },
  ]

  // Split into ~4 acts if enough chunks
  if (chunks.length >= 4) {
    const size = Math.ceil(chunks.length / 4)
    for (let i = 0; i < 4; i++) {
      const start = i * size
      const end = Math.min(start + size, chunks.length)
      if (start >= chunks.length) break
      const ids = allChunkIds.slice(start, end)
      macroSections.push({
        id: `m${i + 1}`,
        label: `Act ${i + 1} (${ids[0]}-${ids[ids.length - 1]})`,
        chunks: ids,
      })
    }
  }

  return {
    title: options?.title ?? 'Untitled Skit',
    subtitle: options?.subtitle ?? `${chunks.length} chunks, ${speakers.join(', ')}`,
    speakers,
    chunks,
    palaceImages: [],
    macroSections,
    tags: [],
  }
}
