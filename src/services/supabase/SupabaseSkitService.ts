import type { Skit, Chunk, MacroSection } from '@/types/skit'
import type { ISkitService } from '@/services/types'
import { supabase } from '@/services/supabase/client'
import { writeQueue } from '@/services/supabase/writeQueue'

/** Shape of a row in the `skits` table */
interface SkitRow {
  id: string
  title: string
  subtitle: string
  speakers: string[]
  chunks: Chunk[]
  tags: string[]
  palace_images: string[]
  macro_sections: MacroSection[]
  created_by: string | null
  is_seed: boolean
  created_at: string
  updated_at: string
}

function rowToSkit(row: SkitRow): Skit {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    speakers: row.speakers ?? [],
    chunks: row.chunks ?? [],
    tags: row.tags ?? [],
    palaceImages: row.palace_images ?? [],
    macroSections: row.macro_sections ?? [],
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function skitToRow(
  skit: Omit<Skit, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Skit, 'id'>>
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    title: skit.title,
    subtitle: skit.subtitle,
    speakers: skit.speakers,
    chunks: skit.chunks,
    tags: skit.tags,
    palace_images: skit.palaceImages,
    macro_sections: skit.macroSections,
  }
  if (skit.createdBy !== undefined) row.created_by = skit.createdBy
  if ('id' in skit && skit.id) row.id = skit.id
  return row
}

function patchToRow(patch: Partial<Skit>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (patch.title !== undefined) row.title = patch.title
  if (patch.subtitle !== undefined) row.subtitle = patch.subtitle
  if (patch.speakers !== undefined) row.speakers = patch.speakers
  if (patch.chunks !== undefined) row.chunks = patch.chunks
  if (patch.tags !== undefined) row.tags = patch.tags
  if (patch.palaceImages !== undefined) row.palace_images = patch.palaceImages
  if (patch.macroSections !== undefined) row.macro_sections = patch.macroSections
  if (patch.createdBy !== undefined) row.created_by = patch.createdBy
  return row
}

export class SupabaseSkitService implements ISkitService {
  async listSkits(): Promise<Skit[]> {
    const { data, error } = await supabase
      .from('skits')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data as SkitRow[]).map(rowToSkit)
  }

  async getSkit(id: string): Promise<Skit | null> {
    const { data, error } = await supabase
      .from('skits')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw error
    return data ? rowToSkit(data as SkitRow) : null
  }

  async createSkit(
    input: Omit<Skit, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Skit> {
    // skits.id is TEXT with no DB default, so the client must supply one
    const row = skitToRow({ ...input, id: crypto.randomUUID() })

    // Set created_by to current auth user if available
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) row.created_by = user.id
    } catch {
      // No auth session — allow anonymous creation for local mode
    }

    const { data, error } = await supabase
      .from('skits')
      .insert(row)
      .select('*')
      .single()

    if (error) throw error
    return rowToSkit(data as SkitRow)
  }

  async updateSkit(id: string, patch: Partial<Skit>): Promise<Skit> {
    const row = patchToRow(patch)

    // Optimistic: enqueue for offline resilience, but also do a direct update
    // so we get the returned row immediately
    const { data, error } = await supabase
      .from('skits')
      .update(row)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      // If direct write fails (e.g., offline), enqueue and return best-effort
      writeQueue.enqueue({
        table: 'skits',
        operation: 'update',
        data: row,
        match: { id },
      })
      // Return a synthetic skit — caller should refetch when back online
      const existing = await this.getSkit(id)
      if (!existing) throw new Error(`Skit not found: ${id}`)
      return { ...existing, ...patch, updatedAt: new Date().toISOString() }
    }

    return rowToSkit(data as SkitRow)
  }

  async deleteSkit(id: string): Promise<void> {
    const { error } = await supabase
      .from('skits')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      writeQueue.enqueue({
        table: 'skits',
        operation: 'update',
        data: { deleted_at: new Date().toISOString() },
        match: { id },
      })
    }
  }
}
