import { useState, useCallback, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { useSkitContext } from '@/context/SkitContext'
import { useGoal } from '@/context/GoalContext'
import { useTheme } from '@/design/theme'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useSessionTracker } from '@/hooks/useSessionTracker'
import { useServices } from '@/services/ServiceProvider'
import { SEED_SKITS } from '@/data/skits'
import { decodeSkitFromUrl } from '@/lib/sharing'
import { TabBar } from '@/components/molecules/TabBar'
import { LibraryView } from '@/components/molecules/LibraryView'
import { SkitImporter } from '@/components/molecules/SkitImporter'
import { NotesPanel } from '@/components/molecules/NotesPanel'
import { GoalSetter } from '@/components/molecules/GoalSetter'
import { DailyTodos } from '@/components/molecules/DailyTodos'
import { TodayGoal } from '@/components/molecules/TodayGoal'
import { ReadMode } from '@/components/tools/ReadMode'
import { FillMode } from '@/components/tools/FillMode'
import { FreeWriteMode } from '@/components/tools/FreeWriteMode'
import { FirstLetterMode } from '@/components/tools/FirstLetterMode'
import { ChunkMode } from '@/components/tools/ChunkMode'
import { FlashcardMode } from '@/components/tools/FlashcardMode'
import { CueMode } from '@/components/tools/CueMode'
import { RSVPMode } from '@/components/tools/RSVPMode'
import { ChainMode } from '@/components/tools/ChainMode'
import { RecallMode } from '@/components/tools/RecallMode'
import { LociMode } from '@/components/tools/LociMode'
import { PerformMode } from '@/components/tools/PerformMode'
import { EditorMode } from '@/components/tools/EditorMode'
import { MapView } from '@/components/tools/MapView'
import { FutureMode } from '@/components/tools/FutureMode'
import { Dashboard } from '@/components/tools/Dashboard'
import { StudyGuide } from '@/components/tools/StudyGuide'
import type { ToolId } from '@/types/tools'
import type { Skit } from '@/types/skit'
import { AccountButton } from '@/components/auth/AccountButton'

/** The default way through a text: read it, then retrieve it with less and less help. */
const STUDY_PATH: Array<{ id: ToolId; label: string }> = [
  { id: 'read', label: 'Read' },
  { id: 'firstletter', label: 'First letters' },
  { id: 'fill', label: 'Fill blanks' },
  { id: 'freewrite', label: 'Write it' },
]

function ToolContent({ toolId }: { toolId: ToolId }) {
  const { setActiveTool } = useApp()
  switch (toolId) {
    case 'read': return <ReadMode />
    case 'fill': return <FillMode />
    case 'freewrite': return <FreeWriteMode />
    case 'firstletter': return <FirstLetterMode />
    case 'chunk': return <ChunkMode />
    case 'flashcard': return <FlashcardMode />
    case 'cue': return <CueMode />
    case 'rsvp': return <RSVPMode />
    case 'chain': return <ChainMode />
    case 'recall': return <RecallMode />
    case 'loci': return <LociMode />
    case 'perform': return <PerformMode />
    case 'editor': return <EditorMode />
    case 'map': return <MapView onNavigate={id => setActiveTool(id)} />
    case 'future': return <FutureMode />
    case 'dashboard': return <Dashboard />
    case 'studyguide': return <StudyGuide />
    default: return <p>Unknown tool</p>
  }
}

export function AppShell() {
  const { activeTool, setActiveTool, visited, currentSkitId, setCurrentSkitId, skitLibrary, refreshLibrary } = useApp()
  const { skitTitle, skitSubtitle, tags } = useSkitContext()
  const { streak } = useGoal()
  const { isDark, toggle } = useTheme()
  const { skitService } = useServices()
  const [view, setView] = useState<'library' | 'practice'>('practice')
  const [importerOpen, setImporterOpen] = useState(false)
  const [showAllTools, setShowAllTools] = useState(false)
  const [showExtras, setShowExtras] = useState(false)

  // --- Share via URL: check for ?skit= param on mount ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const encoded = params.get('skit')
    if (!encoded) return

    const skit = decodeSkitFromUrl(encoded)
    if (!skit) return

    // Dedup: skip if a skit with the same title already exists
    const existing = skitLibrary.find(s => s.title === skit.title)
    if (existing) {
      // Already imported — just clean the URL
      window.history.replaceState({}, '', window.location.pathname)
      return
    }

    skitService.createSkit(skit).then(() => {
      refreshLibrary()
    }).catch(() => {
      // silent
    })

    window.history.replaceState({}, '', window.location.pathname)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useKeyboardShortcuts({ setActiveTool, skitLibrary, currentSkitId, setCurrentSkitId })
  useSessionTracker()

  const handleOpenSkit = useCallback((_skit: Skit) => {
    setView('practice')
    setActiveTool('read')
  }, [setActiveTool])

  const stepIdx = STUDY_PATH.findIndex(s => s.id === activeTool)
  const nextStep = stepIdx >= 0 ? STUDY_PATH[stepIdx + 1] : undefined

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)', fontFamily: 'var(--font-sans)' }}>
      <div className="max-w-[800px] mx-auto px-4 py-5">
        {/* Header */}
        <div className="mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-[22px] font-extrabold text-[var(--color-green-dark)] m-0">Memoria</h1>
              {view === 'practice' && (
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 mb-0">{skitSubtitle}</p>
              )}
            </div>
            <div className="flex gap-2 items-center">
              {streak && streak.currentStreak > 0 && (
                <span className="px-2 py-1 rounded-lg text-[11px] font-bold text-[var(--color-pink)]">
                  🔥 {streak.currentStreak}
                </span>
              )}
              <AccountButton />
              <button onClick={toggle}
                className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs cursor-pointer text-[var(--color-text-secondary)]">
                {isDark ? '☀️' : '🌙'}
              </button>
            </div>
          </div>

          {/* View toggle */}
          <div className="mt-3 flex rounded-lg overflow-hidden border border-[var(--color-border)] w-fit">
            {(['library', 'practice'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors border-none ${
                  view === v ? 'bg-[var(--color-green-main)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-gray-100)]'
                }`}>
                {v === 'library' ? '📚 Library' : '🎯 Practice'}
              </button>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
             LIBRARY VIEW
           ═══════════════════════════════════════════════════════════════ */}
        {view === 'library' && (
          <LibraryView
            onOpenSkit={handleOpenSkit}
            onImport={() => setImporterOpen(true)}
          />
        )}

        {/* ═══════════════════════════════════════════════════════════════
             PRACTICE VIEW
           ═══════════════════════════════════════════════════════════════ */}
        {view === 'practice' && (
          <>
            {/* Current skit title bar */}
            {currentSkitId && (
              <div className="mb-3 flex items-center gap-2">
                <button
                  onClick={() => setView('library')}
                  className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-green-main)] cursor-pointer bg-transparent border-none"
                >
                  ← Library
                </button>
                <h2 className="text-sm font-bold text-[var(--color-green-dark)] truncate flex-1">
                  {skitTitle}
                </h2>
                {tags.length > 0 && (
                  <div className="flex gap-1 shrink-0">
                    {tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[var(--color-green-faded)] text-[var(--color-green-dark)]"
                      >
                        {tag}
                      </span>
                    ))}
                    {tags.length > 3 && (
                      <span className="text-[9px] text-[var(--color-text-muted)]">+{tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Study path: the four steps, in order */}
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {STUDY_PATH.map((step, n) => (
                <button key={step.id} onClick={() => { setActiveTool(step.id); setShowAllTools(false) }}
                  className={`py-2 px-1 rounded-xl border text-center cursor-pointer transition-colors ${
                    activeTool === step.id
                      ? 'border-[var(--color-green-main)] bg-[var(--color-green-main)] text-white'
                      : visited.has(step.id)
                      ? 'border-[var(--color-green-light)] bg-[var(--color-green-faded)] text-[var(--color-green-dark)]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                  }`}>
                  <div className="text-[10px] opacity-75">{n + 1}</div>
                  <div className="text-xs font-semibold leading-tight">{step.label}</div>
                </button>
              ))}
            </div>

            <div className="flex gap-3 mb-3 text-xs">
              <button onClick={() => setShowAllTools(v => !v)}
                className="bg-transparent border-none p-0 cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-green-main)]">
                {showAllTools ? '▾' : '▸'} All tools
              </button>
              {currentSkitId && (
                <button onClick={() => setShowExtras(v => !v)}
                  className="bg-transparent border-none p-0 cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-green-main)]">
                  {showExtras ? '▾' : '▸'} Goals & notes
                </button>
              )}
            </div>

            {showAllTools && <TabBar active={activeTool} visited={visited} onSelect={setActiveTool} />}

            {showExtras && (
              <div className="mb-3">
                <GoalSetter />
                <DailyTodos onNavigate={setActiveTool} />
                {currentSkitId && <TodayGoal />}
                {currentSkitId && <NotesPanel />}
              </div>
            )}

            {/* Tool Content */}
            <div className="p-4 border border-[var(--color-border)] rounded-xl min-h-[300px]" style={{ background: 'var(--color-surface)' }}>
              <ToolContent key={`${currentSkitId}-${activeTool}`} toolId={activeTool} />
              {nextStep && (
                <div className="mt-6 pt-3 border-t border-[var(--color-border)] flex justify-end">
                  <button onClick={() => setActiveTool(nextStep.id)}
                    className="px-4 py-2 rounded-lg border-none bg-[var(--color-green-main)] text-white text-sm font-semibold cursor-pointer">
                    Next: {nextStep.label} →
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Importer Modal */}
      <SkitImporter open={importerOpen} onClose={() => setImporterOpen(false)} onCreated={refreshLibrary} />
    </div>
  )
}
