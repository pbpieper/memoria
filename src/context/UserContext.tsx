import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '@/types/user'
import { useServices } from '@/services/ServiceProvider'

interface UserContextValue {
  user: User | null
  updatePreferences: (prefs: Partial<User['preferences']>) => Promise<void>
}

const UserCtx = createContext<UserContextValue>({ user: null, updatePreferences: async () => {} })

export function useUser() {
  return useContext(UserCtx)
}

export function UserProvider({ children }: { children: ReactNode }) {
  const { userService } = useServices()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Clear the previous service's user first: keeping a stale local user id
    // after sign-in made cloud writes fail row-level security.
    setUser(null)
    let cancelled = false
    userService.getCurrentUser().then(u => { if (!cancelled) setUser(u) }).catch(e => {
      console.warn('[UserContext] Failed to load user:', e)
    })
    return () => { cancelled = true }
  }, [userService])

  const updatePreferences = async (prefs: Partial<User['preferences']>) => {
    if (!user) return
    await userService.updatePreferences(user.id, prefs)
    setUser(prev => prev ? { ...prev, preferences: { ...prev.preferences, ...prefs } } : null)
  }

  return (
    <UserCtx.Provider value={{ user, updatePreferences }}>
      {children}
    </UserCtx.Provider>
  )
}
