import { createContext, useContext } from 'react'

export interface AccountState {
  /** 'cloud' = signed in and syncing, 'local' = this device only, 'none' = Supabase not configured */
  mode: 'cloud' | 'local' | 'none'
  email: string | null
  showSignIn: () => void
  signOut: () => Promise<void>
}

export const AccountCtx = createContext<AccountState>({
  mode: 'none',
  email: null,
  showSignIn: () => {},
  signOut: async () => {},
})

export function useAccount() {
  return useContext(AccountCtx)
}
