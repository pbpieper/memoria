import { useState, useRef, useCallback } from 'react'
import { useSkitContext } from '@/context/SkitContext'
import { useApp } from '@/context/AppContext'
import { useServices } from '@/services/ServiceProvider'
import { useCreativeHub } from '@/hooks/useCreativeHub'
import { useDebouncedSave } from '@/hooks/useDebouncedSave'
import { SciencePanel } from '@/components/molecules/SciencePanel'
import { InlineTags } from '@/components/molecules/InlineTags'
import type { Chunk, Line } from '@/types/skit'
import toast from 'react-hot-toast'

export function ReadMode() {
  const { chunks, skitId, tags } = useSkitContext()
  const { refreshLibrary, skitLibrary } = useApp()
  const { skitService } = useServices()
  const { available, speak } = useCreativeHub()
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [speaking, setSpeaking] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editedChunks, setEditedChunks] = useState<Chunk[] | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const currentSkit = skitLibrary.find(s => s.id === skitId)
  const displayChunks = editedChunks ?? chunks

  // Debounced tag saving — tags are synced after 1.5s of inactivity
  const { save: debouncedSaveTags, isPending: tagsSaving } = useDebouncedSave<string[]>(
    async (newTags) => {
      await skitService.updateSkit(skitId, { tags: newTags })
      refreshLibrary()
    },
    1500,
  )

  const handleSpeak = async (key: string, text: string) => {
    if (speaking === key) {
      audioRef.current?.pause()
      setSpeaking(null)
      return
    }
    setSpeaking(key)
    try {
      const url = await speak(text)
      if (audioRef.current) audioRef.current.pause()
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => setSpeaking(null)
      audio.play()
    } catch {
      toast.error('TTS unavailable')
      setSpeaking(null)
    }
  }

  const toggle = (key: string) => {
    setRevealed(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const handleTagsChange = useCallback((newTags: string[]) => {
    debouncedSaveTags(newTags)
  }, [debouncedSaveTags])

  const startEdit = () => {
    setEditedChunks(JSON.parse(JSON.stringify(chunks)))
    setEditMode(true)
  }

  const cancelEdit = () => {
    setEditedChunks(null)
    setEditMode(false)
  }

  const saveEdit = async () => {
    if (!editedChunks) return
    await skitService.updateSkit(skitId, { chunks: editedChunks })
    await refreshLibrary()
    setEditedChunks(null)
    setEditMode(false)
    toast.success('Saved')
  }

  const updateChunkLabel = (chunkIdx: number, label: string) => {
    if (!editedChunks) return
    const updated = [...editedChunks]
    updated[chunkIdx] = { ...updated[chunkIdx], label }
    setEditedChunks(updated)
  }

  const updateLineText = (chunkIdx: number, lineIdx: number, text: string) => {
    if (!editedChunks) return
    const updated = [...editedChunks]
    const lines = [...updated[chunkIdx].lines]
    lines[lineIdx] = { ...lines[lineIdx], text }
    updated[chunkIdx] = { ...updated[chunkIdx], lines }
    setEditedChunks(updated)
  }

  const updateLineSpeaker = (chunkIdx: number, lineIdx: number, speaker: string) => {
    if (!editedChunks) return
    const updated = [...editedChunks]
    const lines = [...updated[chunkIdx].lines]
    lines[lineIdx] = { ...lines[lineIdx], speaker }
    updated[chunkIdx] = { ...updated[chunkIdx], lines }
    setEditedChunks(updated)
  }

  return (
    <div>
      <SciencePanel id="read" />

      {/* Tags + Edit toggle */}
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <InlineTags tags={currentSkit?.tags ?? []} onChange={handleTagsChange} />
          {tagsSaving && (
            <span className="text-[10px] text-[var(--color-text-muted)] mt-1 block animate-pulse">
              Saving tags...
            </span>
          )}
        </div>
        <button
          onClick={editMode ? cancelEdit : startEdit}
          className={`px-3 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border shrink-0 transition-colors ${
            editMode
              ? 'border-[var(--color-pink)] text-[var(--color-pink)] bg-[var(--color-pink-faded,#fce4ec)]'
              : 'border-[var(--color-border)] text-[var(--color-text-secondary)] bg-[var(--color-surface)]'
          }`}
        >
          {editMode ? '✕ Cancel' : '✏️ Edit'}
        </button>
      </div>

      {/* Save bar when editing */}
      {editMode && (
        <div className="flex justify-between items-center mb-3">
          {editedChunks && JSON.stringify(editedChunks) !== JSON.stringify(chunks) ? (
            <span className="text-[10px] font-semibold text-[var(--color-pink)] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-pink)] inline-block" />
              Unsaved changes
            </span>
          ) : (
            <span />
          )}
          <button
            onClick={saveEdit}
            className="px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer border-none text-white"
            style={{ background: 'var(--color-green-main)' }}
          >
            Save Changes
          </button>
        </div>
      )}

      {displayChunks.map((chunk, ci) => (
        <div key={chunk.id} className="mb-4 p-3 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)]">
          {/* Chunk label */}
          {editMode ? (
            <input
              value={chunk.label}
              onChange={e => updateChunkLabel(ci, e.target.value)}
              className="text-[11px] font-bold text-[var(--color-green-main)] mb-2 bg-transparent border-b border-[var(--color-green-light)] outline-none w-full py-0.5"
              placeholder="Section title"
            />
          ) : (
            <p className="text-[11px] font-bold text-[var(--color-green-main)] mb-2">
              {chunk.id}. {chunk.label}
            </p>
          )}

          {/* Lines */}
          {chunk.lines.map((line, li) => {
            const anchorKey = `${chunk.id}-${li}-anchor`
            const visualKey = `${chunk.id}-${li}-visual`
            return (
              <div key={li} className="mb-2">
                {editMode ? (
                  <div className="flex gap-1 items-start">
                    <input
                      value={line.speaker}
                      onChange={e => updateLineSpeaker(ci, li, e.target.value)}
                      className="text-[13px] font-bold text-[var(--color-pink)] bg-transparent border-b border-[var(--color-pink-mid,#f48fb1)] outline-none w-24 shrink-0 py-0.5"
                    />
                    <span className="text-[13px] text-[var(--color-text-secondary)]">:</span>
                    <textarea
                      value={line.text}
                      onChange={e => updateLineText(ci, li, e.target.value)}
                      className="text-[13px] text-[var(--color-text-primary)] leading-relaxed bg-transparent border-b border-[var(--color-border)] outline-none flex-1 resize-none py-0.5"
                      rows={Math.ceil(line.text.length / 60)}
                    />
                  </div>
                ) : (
                  <p className="text-[13px] text-[var(--color-text-primary)] leading-relaxed">
                    <span className="font-bold text-[var(--color-pink)]">{line.speaker}: </span>
                    {line.text}
                  </p>
                )}

                {!editMode && (
                  <>
                    {available && (
                      <button
                        onClick={() => handleSpeak(`${chunk.id}-${li}`, `${line.speaker}: ${line.text}`)}
                        className="text-[10px] mt-1 mr-2 px-2 py-0.5 rounded-md border border-[var(--color-gray-300)] bg-[var(--color-gray-100)] text-[var(--color-gray-600)] cursor-pointer"
                      >
                        {speaking === `${chunk.id}-${li}` ? '⏹ Stop' : '🔊 Hear'}
                      </button>
                    )}
                    {line.anchor && (
                      <button
                        onClick={() => toggle(anchorKey)}
                        className="text-[10px] mt-1 mr-2 px-2 py-0.5 rounded-md border border-[var(--color-green-light)] bg-[var(--color-green-faded)] text-[var(--color-green-dark)] cursor-pointer"
                      >
                        {revealed.has(anchorKey) ? `🔗 ${line.anchor}` : '🔗 Anchor'}
                      </button>
                    )}
                    {line.visual && (
                      <button
                        onClick={() => toggle(visualKey)}
                        className="text-[10px] mt-1 px-2 py-0.5 rounded-md border border-[var(--color-pink-mid)] bg-[var(--color-pink-faded)] text-[var(--color-pink-dark)] cursor-pointer"
                      >
                        {revealed.has(visualKey) ? `🎬 ${line.visual}` : '🎬 Visual'}
                      </button>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
