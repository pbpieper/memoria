import { useState } from 'react'
import { Modal } from '@/components/atoms/Modal'
import { Button } from '@/components/atoms/Button'
import { InlineTags } from '@/components/molecules/InlineTags'
import { parseSkitFromText } from '@/data/skit-parser'
import { useServices } from '@/services/ServiceProvider'
import { useCreativeHub } from '@/hooks/useCreativeHub'
import toast from 'react-hot-toast'
import type { Skit } from '@/types/skit'
import { hasMultipleSpeakers } from '@/lib/text'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (skit: Skit) => void
}

export function SkitImporter({ open, onClose, onCreated }: Props) {
  const { skitService } = useServices()
  const { available: hubAvailable, askLLM } = useCreativeHub()
  const [raw, setRaw] = useState('')
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [preview, setPreview] = useState<ReturnType<typeof parseSkitFromText> | null>(null)
  const [enhancing, setEnhancing] = useState(false)

  const handlePreview = () => {
    if (!raw.trim()) return
    // No title typed: use the text's first line, like a poem's first line
    const firstLine = raw.trim().split('\n')[0].replace(/^[A-Z][A-Z .'-]{0,29}:\s*/, '').trim()
    const fallback = firstLine.length > 40 ? firstLine.slice(0, 40).replace(/\s+\S*$/, '') + '…' : firstLine
    const parsed = parseSkitFromText(raw, { title: title.trim() || fallback || undefined })
    setPreview(parsed)
  }

  const handleSmartFormat = async () => {
    if (!raw.trim()) return
    setEnhancing(true)
    try {
      const response = await askLLM(
        `Format this text as a performance script. Identify speakers and label them with "SPEAKER:" prefix. Separate logical sections with blank lines. Keep the original text exactly — only add speaker labels and formatting. If speakers are already labeled, clean up formatting.\n\nText:\n${raw}`,
        { system: 'You are a script formatting assistant. Output ONLY the formatted script text, nothing else.' }
      )
      setRaw(response)
      toast.success('Script formatted by AI')
    } catch {
      toast.error('LLM unavailable — format manually')
    } finally {
      setEnhancing(false)
    }
  }

  const handleCreate = async () => {
    if (!preview) return
    const skitWithTags = { ...preview, tags }
    let created: Skit
    try {
      created = await skitService.createSkit(skitWithTags)
    } catch (e) {
      console.error('[SkitImporter] createSkit failed:', e)
      const detail = e instanceof Error ? e.message : (e as { message?: string })?.message
      toast.error(`Couldn't save "${preview.title}"${detail ? `: ${detail}` : ''}`, { duration: 6000 })
      return
    }
    toast.success(`Added "${preview.title}"`)
    setRaw('')
    setTitle('')
    setTags([])
    setPreview(null)
    onCreated(created)
    onClose()
  }

  const handleClose = () => {
    setPreview(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add a text">
      {!preview ? (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="px-3 py-2 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)]"
          />
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">Tags</label>
            <InlineTags tags={tags} onChange={setTags} editable={true} />
          </div>
          <textarea
            placeholder={"Paste what you want to learn: a poem, a song, a speech…\n\nA blank line starts a new section.\nFor a dialogue, start each line with the name, e.g.\nANNA: Hello."}
            value={raw}
            onChange={e => setRaw(e.target.value)}
            rows={12}
            className="px-3 py-2 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-mono text-[var(--color-text-primary)] resize-y"
          />
          <div className="flex gap-2">
            {hubAvailable && (
              <Button variant="secondary" onClick={handleSmartFormat} disabled={!raw.trim() || enhancing}>
                {enhancing ? 'Formatting...' : 'AI Format'}
              </Button>
            )}
            <Button onClick={handlePreview} disabled={!raw.trim()}>
              Preview
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="text-sm">
            <p className="font-bold text-[var(--color-green-dark)]">{preview.title}</p>
            <p className="text-[var(--color-text-secondary)] text-xs">{preview.subtitle}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">Tags</label>
            <InlineTags tags={tags} onChange={setTags} editable={true} />
          </div>
          <div className="max-h-60 overflow-auto rounded-lg border border-[var(--color-border)] p-3">
            {preview.chunks.map(c => (
              <div key={c.id} className="mb-3">
                <p className="text-[11px] font-bold text-[var(--color-green-main)] mb-1">
                  {c.id}. {c.label}
                </p>
                {c.lines.map((l, i) => (
                  <p key={i} className="text-xs text-[var(--color-text-primary)] ml-2 mb-0.5">
                    {hasMultipleSpeakers(preview.speakers) && <span className="font-semibold text-[var(--color-pink)]">{l.speaker}: </span>}{l.text}
                  </p>
                ))}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setPreview(null)}>Back</Button>
            <Button onClick={handleCreate}>Start learning</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
