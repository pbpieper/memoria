import { useEffect } from 'react'
import { ACTIVE_TOOLS } from '@/data/methods'
import type { ToolId } from '@/types/tools'
import type { Skit } from '@/types/skit'

interface Options {
  setActiveTool: (id: ToolId) => void
  skitLibrary: Skit[]
  currentSkitId: string
  setCurrentSkitId: (id: string) => void
}

export function useKeyboardShortcuts({ setActiveTool, skitLibrary, currentSkitId, setCurrentSkitId }: Options) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      // 1-9 for tool switching
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= 9 && num <= ACTIVE_TOOLS.length) {
        e.preventDefault()
        setActiveTool(ACTIVE_TOOLS[num - 1].id)
        return
      }

      // [ and ] for skit switching
      if (e.key === '[' || e.key === ']') {
        e.preventDefault()
        const idx = skitLibrary.findIndex(s => s.id === currentSkitId)
        if (idx === -1) return
        const next = e.key === ']'
          ? (idx + 1) % skitLibrary.length
          : (idx - 1 + skitLibrary.length) % skitLibrary.length
        setCurrentSkitId(skitLibrary[next].id)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setActiveTool, skitLibrary, currentSkitId, setCurrentSkitId])
}
