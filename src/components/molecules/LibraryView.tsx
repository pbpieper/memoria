import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '@/context/AppContext'
import { useStar } from '@/context/StarContext'
import { useServices } from '@/services/ServiceProvider'
import { InlineTags } from '@/components/molecules/InlineTags'
import { SEED_SKITS } from '@/data/skits'
import { buildShareUrl } from '@/lib/sharing'
import { loadGuideProgress } from '@/components/tools/StudyGuide'
import type { Skit } from '@/types/skit'
import clsx from 'clsx'
import toast from 'react-hot-toast'

/* ═══════════════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════════════ */

type SortMode = 'recent' | 'az' | 'progress' | 'tag'

const SEED_IDS = new Set(SEED_SKITS.map(s => s.id))
const SORT_OPTIONS: { mode: SortMode; label: string }[] = [
  { mode: 'recent', label: 'Recent' },
  { mode: 'az', label: 'A–Z' },
  { mode: 'progress', label: 'Progress' },
  { mode: 'tag', label: 'Tag' },
]

/* ═══════════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════════ */

function countWords(skit: Skit): number {
  return skit.chunks.reduce(
    (acc, c) => acc + c.lines.reduce((a, l) => a + l.text.split(/\s+/).filter(Boolean).length, 0),
    0,
  )
}

function getGuideCompletionPct(skitId: string): number {
  const guide = loadGuideProgress(skitId)
  const total = 17
  const done = Object.values(guide).filter(Boolean).length
  return total > 0 ? Math.round((done / total) * 100) : 0
}

/* ═══════════════════════════════════════════════════════════════════════════
   GuideProgressBadge
   ═══════════════════════════════════════════════════════════════════════════ */

function GuideProgressBadge({ skitId }: { skitId: string }) {
  const pct = getGuideCompletionPct(skitId)
  if (pct === 0) return null
  return (
    <span
      className={clsx(
        'text-[10px] font-bold px-2 py-0.5 rounded-full',
        pct === 100
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
          : 'bg-[var(--color-green-faded)] text-[var(--color-green-dark)]',
      )}
    >
      {pct === 100 ? '✓ Done' : `${pct}%`}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SkitCard
   ═══════════════════════════════════════════════════════════════════════════ */

function SkitCard({
  skit,
  onOpen,
  onDelete,
  onEdit,
  onShare,
  isStarred,
  isEditingTitle,
  onStartEditTitle,
  onCancelEditTitle,
  onSaveTitle,
  editTitle,
  onEditTitle,
  onSaveTags,
}: {
  skit: Skit
  onOpen: (s: Skit) => void
  onDelete: (id: string) => void
  onEdit: (s: Skit) => void
  onShare: (s: Skit) => void
  isStarred: boolean
  isEditingTitle: boolean
  onStartEditTitle: () => void
  onCancelEditTitle: () => void
  onSaveTitle: () => Promise<void>
  editTitle: string
  onEditTitle: (title: string) => void
  onSaveTags: (tags: string[]) => Promise<void>
}) {
  const isSeed = SEED_IDS.has(skit.id)
  const lineCount = skit.chunks.reduce((a, c) => a + c.lines.length, 0)
  const wordCount = countWords(skit)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      onClick={() => onOpen(skit)}
      className={clsx(
        'rounded-xl border-[1.5px] px-4 py-3.5 cursor-pointer transition-all duration-150',
        'bg-[var(--color-surface)] hover:shadow-md',
        isStarred
          ? 'border-[var(--color-pink-mid,#f48fb1)] hover:border-[var(--color-pink)]'
          : 'border-[var(--color-border)] hover:border-[var(--color-green-main)]',
      )}
    >
      {/* Top row: title + actions */}
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0 flex-1">
          {isEditingTitle ? (
            <div className="flex gap-2 items-center mb-2">
              <input
                type="text"
                value={editTitle}
                onChange={e => onEditTitle(e.target.value)}
                className="flex-1 px-2 py-1 rounded border-2 border-[var(--color-green-main)] bg-[var(--color-surface)] text-[15px] font-bold text-[var(--color-green-dark)] outline-none"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') onSaveTitle()
                  if (e.key === 'Escape') onCancelEditTitle()
                }}
              />
              <button
                onClick={onSaveTitle}
                className="px-2 py-1 rounded bg-[var(--color-green-main)] text-white text-xs font-semibold cursor-pointer hover:bg-[var(--color-green-mid)]"
              >
                ✓
              </button>
              <button
                onClick={onCancelEditTitle}
                className="px-2 py-1 rounded bg-[var(--color-border)] text-[var(--color-text-secondary)] text-xs font-semibold cursor-pointer hover:bg-[var(--color-gray-200)]"
              >
                ✕
              </button>
            </div>
          ) : (
            <h3
              onClick={onStartEditTitle}
              className="text-[15px] font-bold text-[var(--color-green-dark)] truncate cursor-pointer hover:text-[var(--color-green-main)] transition-colors"
            >
              {isStarred && <span className="mr-1">⭐</span>}
              {skit.title}
            </h3>
          )}
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">{skit.subtitle}</p>
          <div className="mt-1.5">
            <InlineTags
              tags={skit.tags || []}
              onChange={onSaveTags}
              editable={true}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onShare(skit) }}
            className="text-xs px-2 py-1 rounded-md bg-[var(--color-gray-100)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-gray-200)] cursor-pointer font-medium transition-colors"
          >
            🔗
          </button>
          <button
            onClick={e => { e.stopPropagation(); onEdit(skit) }}
            className="text-xs px-2 py-1 rounded-md bg-[var(--color-gray-100)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-gray-200)] cursor-pointer font-medium transition-colors"
          >
            ✏️
          </button>
          {!isSeed && (
            <button
              onClick={e => {
                e.stopPropagation()
                if (window.confirm(`Delete "${skit.title}"? This cannot be undone.`)) {
                  onDelete(skit.id)
                }
              }}
              className="text-[11px] px-2 py-1 rounded-md bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 cursor-pointer font-semibold transition-colors dark:bg-red-950/30 dark:border-red-800 dark:text-red-400"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: metadata + progress */}
      <div className="flex justify-between items-center mt-2.5">
        <div className="flex gap-3.5 text-xs text-[var(--color-text-muted)]">
          <span>{skit.chunks.length} sections</span>
          <span>{lineCount} lines</span>
          <span>{wordCount} words</span>
        </div>
        <GuideProgressBadge skitId={skit.id} />
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   LibraryView  (full-screen, replaces the old SkitSwitcher compact view)
   ═══════════════════════════════════════════════════════════════════════════ */

interface LibraryViewProps {
  onOpenSkit: (skit: Skit) => void
  onImport: () => void
}

export function LibraryView({ onOpenSkit, onImport }: LibraryViewProps) {
  const { skitLibrary, refreshLibrary, setCurrentSkitId } = useApp()
  const { isStarred } = useStar()
  const { skitService } = useServices()
  const [sortMode, setSortMode] = useState<SortMode>('recent')
  const [activeTagFilters, setActiveTagFilters] = useState<Set<string>>(new Set())
  const [editingSkitId, setEditingSkitId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    for (const skit of skitLibrary) {
      if (skit.tags) skit.tags.forEach(t => tags.add(t))
    }
    return [...tags].sort()
  }, [skitLibrary])

  const toggleTagFilter = (tag: string) => {
    setActiveTagFilters(prev => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag); else next.add(tag)
      return next
    })
  }

  // Sort + filter
  const sorted = useMemo(() => {
    let arr = [...skitLibrary]
    if (activeTagFilters.size > 0) {
      arr = arr.filter(s => s.tags && s.tags.some(t => activeTagFilters.has(t)))
    }
    switch (sortMode) {
      case 'recent':
        return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      case 'az':
        return arr.sort((a, b) => a.title.localeCompare(b.title))
      case 'progress':
        return arr.sort((a, b) => getGuideCompletionPct(b.id) - getGuideCompletionPct(a.id))
      case 'tag':
        return arr // handled via tagGroups below
      default:
        return arr
    }
  }, [skitLibrary, sortMode, activeTagFilters])

  // Tag grouping
  const tagGroups = useMemo(() => {
    if (sortMode !== 'tag') return null
    const groups: Record<string, Skit[]> = {}
    const untagged: Skit[] = []
    const filteredLib = activeTagFilters.size > 0
      ? skitLibrary.filter(s => s.tags && s.tags.some(t => activeTagFilters.has(t)))
      : skitLibrary
    for (const skit of filteredLib) {
      if (skit.tags && skit.tags.length > 0) {
        for (const tag of skit.tags) {
          if (activeTagFilters.size > 0 && !activeTagFilters.has(tag)) continue
          if (!groups[tag]) groups[tag] = []
          groups[tag].push(skit)
        }
      } else {
        untagged.push(skit)
      }
    }
    return { groups, untagged }
  }, [skitLibrary, sortMode, activeTagFilters])

  // Handlers
  const handleDelete = useCallback(async (id: string) => {
    if (SEED_IDS.has(id)) return
    try {
      await skitService.deleteSkit(id)
      await refreshLibrary()
    } catch {
      toast.error('Failed to delete')
    }
  }, [skitService, refreshLibrary])

  const handleShare = useCallback((skit: Skit) => {
    const url = buildShareUrl(skit)
    if (!url) return
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Share link copied!')
    }).catch(() => {
      toast.error('Failed to copy link')
    })
  }, [])

  const handleEdit = useCallback((skit: Skit) => {
    setCurrentSkitId(skit.id)
    onOpenSkit(skit)
    // They'll land on Read mode which has inline editing
  }, [setCurrentSkitId, onOpenSkit])

  const handleOpen = useCallback((skit: Skit) => {
    setCurrentSkitId(skit.id)
    onOpenSkit(skit)
  }, [setCurrentSkitId, onOpenSkit])

  const handleStartEditTitle = useCallback((skit: Skit) => {
    setEditingSkitId(skit.id)
    setEditTitle(skit.title)
  }, [])

  const handleCancelEditTitle = useCallback(() => {
    setEditingSkitId(null)
    setEditTitle('')
  }, [])

  const handleSaveTitle = useCallback(async () => {
    if (!editingSkitId || !editTitle.trim()) {
      handleCancelEditTitle()
      return
    }
    try {
      const skit = skitLibrary.find(s => s.id === editingSkitId)
      if (!skit) return
      await skitService.updateSkit(editingSkitId, { ...skit, title: editTitle.trim() })
      await refreshLibrary()
      toast.success('Title updated')
      setEditingSkitId(null)
    } catch {
      toast.error('Failed to update title')
    }
  }, [editingSkitId, editTitle, skitLibrary, skitService, refreshLibrary, handleCancelEditTitle])

  const handleSaveTags = useCallback(async (skitId: string, newTags: string[]) => {
    try {
      const skit = skitLibrary.find(s => s.id === skitId)
      if (!skit) return
      await skitService.updateSkit(skitId, { ...skit, tags: newTags })
      await refreshLibrary()
      toast.success('Tags updated')
    } catch {
      toast.error('Failed to update tags')
    }
  }, [skitLibrary, skitService, refreshLibrary])

  const renderCard = (skit: Skit) => (
    <SkitCard
      key={skit.id}
      skit={skit}
      onOpen={handleOpen}
      onDelete={handleDelete}
      onEdit={handleEdit}
      onShare={handleShare}
      isStarred={isStarred(skit.id)}
      isEditingTitle={editingSkitId === skit.id}
      onStartEditTitle={() => handleStartEditTitle(skit)}
      onCancelEditTitle={handleCancelEditTitle}
      onSaveTitle={handleSaveTitle}
      editTitle={editTitle}
      onEditTitle={setEditTitle}
      onSaveTags={(tags) => handleSaveTags(skit.id, tags)}
    />
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl font-extrabold text-[var(--color-green-dark)]">Your Library</h2>
        <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5">
          Skits, monologues, songs, poems — anything to memorize.
        </p>
      </div>

      {/* Add button */}
      <button
        onClick={onImport}
        className="w-full py-3.5 rounded-xl border-2 border-dashed border-[var(--color-green-light)] bg-[var(--color-green-faded)] text-[15px] font-bold text-[var(--color-green-main)] hover:border-[var(--color-green-main)] hover:bg-[var(--color-green-bright)] cursor-pointer transition-colors mb-4"
      >
        + Add New Text
      </button>

      {/* Sort controls */}
      <div className="flex gap-1.5 mb-2 flex-wrap">
        {SORT_OPTIONS.map(sb => (
          <button
            key={sb.mode}
            onClick={() => setSortMode(sb.mode)}
            className={clsx(
              'px-3 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-all border',
              sortMode === sb.mode
                ? 'bg-[var(--color-green-faded)] text-[var(--color-green-dark)] border-[var(--color-green-light)]'
                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-green-light)]',
            )}
          >
            {sb.label}
          </button>
        ))}
      </div>

      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <div className="flex gap-1.5 mb-4 flex-wrap items-center">
          <span className="text-[10px] text-[var(--color-text-muted)] font-semibold mr-0.5">Tags:</span>
          {allTags.map(tag => {
            const active = activeTagFilters.has(tag)
            return (
              <button
                key={tag}
                onClick={() => toggleTagFilter(tag)}
                className={clsx(
                  'px-2.5 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer transition-all border',
                  active
                    ? 'bg-[var(--color-pink-faded,#fce4ec)] text-[var(--color-pink-dark,#880e4f)] border-[var(--color-pink-mid,#f48fb1)]'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-pink-mid,#f48fb1)]',
                )}
              >
                {tag}
              </button>
            )
          })}
          {activeTagFilters.size > 0 && (
            <button
              onClick={() => setActiveTagFilters(new Set())}
              className="text-[10px] text-[var(--color-text-muted)] underline cursor-pointer bg-transparent border-none"
            >
              clear
            </button>
          )}
        </div>
      )}

      {/* Card list */}
      <AnimatePresence mode="popLayout">
        {sortMode === 'tag' && tagGroups ? (
          <div className="flex flex-col gap-5">
            {Object.entries(tagGroups.groups)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([tag, skits]) => (
                <div key={tag}>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-pink-dark,#880e4f)] mb-2 px-2 py-1 rounded bg-[var(--color-pink-faded,#fce4ec)] inline-block">
                    {tag}
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {skits.map(renderCard)}
                  </div>
                </div>
              ))}
            {tagGroups.untagged.length > 0 && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                  Untagged
                </div>
                <div className="flex flex-col gap-2.5">
                  {tagGroups.untagged.map(renderCard)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {sorted.map(renderCard)}
          </div>
        )}
      </AnimatePresence>

      {skitLibrary.length === 0 && (
        <p className="text-center text-sm text-[var(--color-text-muted)] py-12">
          No texts yet. Add your first one above!
        </p>
      )}
    </div>
  )
}
