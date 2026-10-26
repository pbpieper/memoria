import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Skit } from '@/types/skit'
import type { ToolId } from '@/types/tools'
import { useServices } from '@/services/ServiceProvider'
import { toActiveTool } from '@/data/methods'
import { normalizeSkit } from '@/lib/text'

interface AppContextValue {
  activeTool: ToolId
  setActiveTool: (id: ToolId) => void
  visited: Set<ToolId>
  currentSkitId: string
  setCurrentSkitId: (id: string) => void
  skitLibrary: Skit[]
  refreshLibrary: () => Promise<void>
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
  const [currentSkitId, setCurrentSkitId] = useState<string>('')
  const [activeTool, setActiveToolState] = useState<ToolId>('studyguide')
  const [visited, setVisited] = useState<Set<ToolId>>(new Set(['studyguide']))

  const refreshLibrary = useCallback(async () => {
    try {
      // Long pasted songs get readable sections; nothing is written back
      const skits = (await skitService.listSkits()).map(normalizeSkit)
      setSkitLibrary(skits)
      if (!currentSkitId && skits.length > 0) {
        setCurrentSkitId(skits[0].id)
      }
    } catch (e) {
      console.warn('[AppContext] Failed to load library:', e)
    }
  }, [skitService, currentSkitId])

  useEffect(() => {
    refreshLibrary()
  }, [refreshLibrary])

  // Hidden tools can't be opened from anywhere: the day plan, ladder or a shortcut lands on the nearest shown tool
  const setActiveTool = useCallback((requested: ToolId) => {
    const id = toActiveTool(requested)
    setActiveToolState(id)
    setVisited(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  return (
    <AppCtx.Provider value={{ activeTool, setActiveTool, visited, currentSkitId, setCurrentSkitId, skitLibrary, refreshLibrary }}>
      {children}
    </AppCtx.Provider>
  )
}
