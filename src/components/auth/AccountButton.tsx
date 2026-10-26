import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAccount } from './AccountContext'

/** Header control that always shows where data is saved, with sign in / sign out. */
export function AccountButton() {
  const { mode, email, showSignIn, signOut } = useAccount()
  const [open, setOpen] = useState(false)

  if (mode === 'none') return null

  const base = 'px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs cursor-pointer'

  if (mode === 'local') {
    return (
      <button onClick={showSignIn} className={`${base} text-[var(--color-text-secondary)]`} title="Saved on this device only">
        📱 This device · <span className="font-semibold text-[var(--color-green-main)]">Sign in to sync</span>
      </button>
    )
  }

  const handleSignOut = async () => {
    setOpen(false)
    try {
      await signOut()
    } catch (e) {
      toast.error(`Sign out failed: ${e instanceof Error ? e.message : 'unknown error'}`)
    }
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className={`${base} text-[var(--color-text-secondary)]`} title={email ?? undefined}>
        {/* The account name is always visible, so signing in with the wrong address is obvious */}
        ☁️ {email ? email.split('@')[0] : 'Synced'}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 z-50 min-w-[200px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-lg text-xs">
          <p className="m-0 text-[var(--color-text-muted)]">Signed in as</p>
          <p className="m-0 mb-2 font-semibold text-[var(--color-text-primary)] break-all">{email}</p>
          <button onClick={handleSignOut} className={`${base} w-full text-[var(--color-pink)]`}>
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
