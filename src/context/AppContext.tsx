import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Skit } from '@/types/skit'
import type { ToolId } from '@/types/tools'
import { useServices } from '@/services/ServiceProvider'
import { normalizeSkit } from '@/lib/text'

const LAST_SKIT_KEY = 'memoria:lastSkitId'

export function readLastSkitId(): string {
  try { return localStorage.getItem(LAST_SKIT_KEY) ?? '' } catch { return '' }
}

interface AppContextValue {
  activeTool: ToolId
  setActiveTool: (id: ToolId) => void
  visited: Set<ToolId>
  currentSkitId: string
  setCurrentSkitId: (id: string) => void
  skitLibrary: Skit[]
  refreshLibrary: () => Promise<void>
  /** Section being studied ('all' or a chunk id), shared by the study steps */
  section: string
  setSection: (s: string) => void
}

const AppCtx = createContext<AppContextValue | null>(null)

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { skitService } = useServices()
  const [skitLibrary, setSkitLibrary] = useState<Skit[]>([])
  const [currentSkitId, setCurrentSkitIdState] = useState<string>('')

  const setCurrentSkitId = useCallback((id: string) => {
    setCurrentSkitIdState(id)
    try { localStorage.setItem(LAST_SKIT_KEY, id) } catch { /* private mode */ }
  }, [])
  // Kept with its text id so switching texts starts again at 'all'
  const [studied, setStudied] = useState<{ skitId: string; section: string }>({ skitId: '', section: 'all' })
  const section = studied.skitId === currentSkitId ? studied.section : 'all'
  const setSection = useCallback((s: string) => setStudied({ skitId: currentSkitId, section: s }), [currentSkitId])
  const [activeTool, setActiveToolState] = useState<ToolId>('read')
  const [visited, setVisited] = useState<Set<ToolId>>(new Set(['read']))

  const refreshLibrary = useCallback(async () => {
    try {
      const skits = (await skitService.listSkits()).map(normalizeSkit)
      setSkitLibrary(skits)
      if (!currentSkitId && skits.length > 0) {
        const last = readLastSkitId()
        setCurrentSkitIdState(skits.some(s => s.id === last) ? last : skits[0].id)
      }
    } catch (e) {
      console.warn('[AppContext] Failed to load library:', e)
    }
  }, [skitService, currentSkitId])

  useEffect(() => {
    refreshLibrary()
  }, [refreshLibrary])

  const setActiveTool = useCallback((id: ToolId) => {
    setActiveToolState(id)
    setVisited(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  return (
    <AppCtx.Provider value={{ activeTool, setActiveTool, visited, currentSkitId, setCurrentSkitId, skitLibrary, refreshLibrary, section, setSection }}>
      {children}
    </AppCtx.Provider>
  )
}
