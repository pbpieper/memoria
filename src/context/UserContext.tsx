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
  // Remember which service loaded the user: right after sign-in the services
  // swap, and for one render the old (local) user must not reach cloud writes.
  const [loaded, setLoaded] = useState<{ service: typeof userService; user: User } | null>(null)
  const user = loaded?.service === userService ? loaded.user : null
  const setUser = (update: (prev: User | null) => User | null) =>
    setLoaded(prev => {
      if (!prev) return prev
      const next = update(prev.user)
      return next ? { ...prev, user: next } : null
    })

  useEffect(() => {
    let cancelled = false
    userService.getCurrentUser().then(u => { if (!cancelled) setLoaded({ service: userService, user: u }) }).catch(e => {
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
