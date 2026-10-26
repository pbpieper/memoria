import { useState, useCallback, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { useSkitContext } from '@/context/SkitContext'
import { useGoal } from '@/context/GoalContext'
import { useTheme } from '@/design/theme'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useSessionTracker } from '@/hooks/useSessionTracker'
import { useServices } from '@/services/ServiceProvider'
import { ACTIVE_TOOLS } from '@/data/methods'
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
    setActiveTool('studyguide')
  }, [setActiveTool])

  const progress = (visited.size / ACTIVE_TOOLS.length) * 100

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

          {/* View toggle + progress bar */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex rounded-lg overflow-hidden border border-[var(--color-border)]">
              <button
                onClick={() => setView('library')}
                className={`px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors border-none ${
                  view === 'library'
                    ? 'bg-[var(--color-green-main)] text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-gray-100)]'
                }`}
              >
                📚 Library
              </button>
              <button
                onClick={() => setView('practice')}
                className={`px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors border-none border-l border-l-[var(--color-border)] ${
                  view === 'practice'
                    ? 'bg-[var(--color-green-main)] text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-gray-100)]'
                }`}
              >
                🎯 Practice
              </button>
            </div>
            {view === 'practice' && (
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-1 rounded-sm" style={{ background: 'var(--color-gray-200)' }}>
                  <div className="h-1 rounded-sm transition-[width] duration-400" style={{ background: 'var(--color-green-main)', width: `${progress}%` }} />
                </div>
                <span className="text-[10px] text-[var(--color-text-secondary)]">{visited.size}/{ACTIVE_TOOLS.length}</span>
              </div>
            )}
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

            {/* Goal + Daily Todos */}
            <GoalSetter />
            <DailyTodos onNavigate={setActiveTool} />

            {/* Today's Goal */}
            {currentSkitId && <TodayGoal />}

            {/* Notes Panel */}
            {currentSkitId && <NotesPanel />}

            {/* Tab Bar (categorized) */}
            <TabBar active={activeTool} visited={visited} onSelect={setActiveTool} />

            {/* Tool Content */}
            <div className="p-4.5 border border-[var(--color-border)] rounded-xl min-h-[300px]" style={{ background: 'var(--color-surface)' }}>
              <ToolContent key={`${currentSkitId}-${activeTool}`} toolId={activeTool} />
            </div>
          </>
        )}
      </div>

      {/* Importer Modal */}
      <SkitImporter open={importerOpen} onClose={() => setImporterOpen(false)} onCreated={refreshLibrary} />
    </div>
  )
}
