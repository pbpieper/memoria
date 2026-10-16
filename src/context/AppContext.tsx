import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Skit } from '@/types/skit'
import type { ToolId } from '@/types/tools'
import { useServices } from '@/services/ServiceProvider'

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
  const [activeTool, setActiveToolState] = useState<ToolId>('read')
  const [visited, setVisited] = useState<Set<ToolId>>(new Set(['read']))

  const refreshLibrary = useCallback(async () => {
    try {
      const skits = await skitService.listSkits()
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

  const setActiveTool = useCallback((id: ToolId) => {
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
