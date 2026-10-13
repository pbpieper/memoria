import type { User } from '@/types/user'
import type { IUserService } from '@/services/types'
import { supabase } from '@/services/supabase/client'
import { writeQueue } from '@/services/supabase/writeQueue'

/** Shape of a row in the `profiles` table */
interface ProfileRow {
  id: string
  name: string
  preferences: User['preferences']
  created_at: string
  updated_at: string
}

function rowToUser(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    preferences: row.preferences ?? { theme: 'system' },
  }
}

export class SupabaseUserService implements IUserService {
  async getCurrentUser(): Promise<User> {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      throw new Error('Not authenticated')
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    if (error) throw error
    if (data) return rowToUser(data as ProfileRow)

    // Accounts created before the signup trigger existed have no profile row;
    // create it (RLS allows inserting your own) so FK-linked writes succeed.
    const { data: created, error: insertError } = await supabase
      .from('profiles')
      .insert({ id: authUser.id, email: authUser.email ?? null })
      .select('*')
      .single()

    if (insertError) throw insertError
    return rowToUser(created as ProfileRow)
  }

  async createUser(name: string): Promise<User> {
    // In the Supabase model, users are created via auth signup.
    // The `handle_new_user` trigger auto-creates a profile row.
    // This method updates the name on the existing profile after signup.
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      throw new Error('Not authenticated — cannot create user profile')
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ name })
      .eq('id', authUser.id)
      .select('*')
      .single()

    if (error) throw error
    return rowToUser(data as ProfileRow)
  }

  async updatePreferences(
    userId: string,
    prefs: Partial<User['preferences']>
  ): Promise<void> {
    // Fetch current preferences to merge
    const { data: current, error: fetchError } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', userId)
      .single()

    if (fetchError) throw fetchError

    const merged = {
      ...((current as { preferences: User['preferences'] }).preferences ?? {}),
      ...prefs,
    }

    writeQueue.enqueue({
      table: 'profiles',
      operation: 'update',
      data: { preferences: merged },
      match: { id: userId },
    })
  }
}
