import { useState, useEffect, type ReactNode } from 'react'
import { isSupabaseAvailable } from '@/services/supabase/client'
import { getSession, onAuthChange, signOut } from '@/services/supabase/auth'
import { migrateLocalToSupabase } from '@/services/dataMigration'
import { AuthScreen } from './AuthScreen'
import { AccountCtx, type AccountState } from './AccountContext'
import type { Session } from '@supabase/supabase-js'
import './auth.css'

interface Props {
  children: ReactNode
}

const SKIP_KEY = 'skit-trainer:auth-skipped'

export function AuthGuard({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [migrating, setMigrating] = useState(false)
  // Local-first escape hatch: never hard-block unauthenticated use
  const [skipped, setSkipped] = useState(() => {
    try { return localStorage.getItem(SKIP_KEY) === 'true' } catch { return false }
  })

  const handleSkip = () => {
    try { localStorage.setItem(SKIP_KEY, 'true') } catch { /* ignore */ }
    setSkipped(true)
  }

  const handleShowAuth = () => {
    try { localStorage.removeItem(SKIP_KEY) } catch { /* ignore */ }
    setSkipped(false)
  }

  const account: AccountState = {
    mode: 'none',
    email: null,
    showSignIn: handleShowAuth,
    // After sign-out, show the choice screen again rather than silently going local
    signOut: async () => { await signOut(); handleShowAuth() },
  }

  useEffect(() => {
    // If Supabase isn't configured, skip auth entirely (local mode)
    if (!isSupabaseAvailable) {
      setLoading(false)
      return
    }

    // Check for existing session
    getSession()
      .then(s => {
        setSession(s)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })

    // Listen for auth state changes
    const subscription = onAuthChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Run data migration after first sign-in
  useEffect(() => {
    if (!session?.user?.id) return

    const alreadyMigrated = localStorage.getItem('skit-trainer:migrated-to-cloud')
    if (alreadyMigrated === 'true') return

    // Check if there's local data worth migrating
    const hasLocalData = localStorage.getItem('skit-trainer:skits') ||
      localStorage.getItem('skit-trainer:goals') ||
      localStorage.getItem('skit-trainer:progress')

    if (!hasLocalData) {
      localStorage.setItem('skit-trainer:migrated-to-cloud', 'true')
      return
    }

    setMigrating(true)
    migrateLocalToSupabase(session.user.id)
      .then(result => {
        if (result.migrated) {
          console.log('[AuthGuard] Migration complete:', result.counts)
        }
      })
      .catch(err => {
        console.error('[AuthGuard] Migration failed:', err)
      })
      .finally(() => {
        setMigrating(false)
      })
  }, [session?.user?.id])

  // Loading state
  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />
      </div>
    )
  }

  // Migrating local data to cloud
  if (migrating) {
    return (
      <div className="auth-migrating">
        <div className="auth-spinner" />
        <p className="auth-migrating-text">Syncing your data…</p>
      </div>
    )
  }

  // No Supabase configured = local mode, render app directly
  if (!isSupabaseAvailable) {
    return <AccountCtx.Provider value={{ ...account, mode: 'none' }}>{children}</AccountCtx.Provider>
  }

  // Supabase configured, no session, user chose local mode:
  // render the app (ServiceProvider falls back to local services);
  // the header AccountButton offers "Sign in to sync".
  if (!session && skipped) {
    return <AccountCtx.Provider value={{ ...account, mode: 'local' }}>{children}</AccountCtx.Provider>
  }

  // Supabase configured but no session = show the sign-in / local choice
  if (!session) {
    return <AuthScreen onSkip={handleSkip} />
  }

  // Authenticated — render app
  return (
    <AccountCtx.Provider value={{ ...account, mode: 'cloud', email: session.user.email ?? null }}>
      {children}
    </AccountCtx.Provider>
  )
}
