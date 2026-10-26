import type { IFeedbackService, FeedbackContext, SentNote } from '@/services/types'
import { loadSentNotes, recordSentNote } from '@/services/local/feedbackHistory'
import { supabase } from './client'

/**
 * Feedback goes to the shared mem_feedback table, signed in or not, so notes from
 * people trying the app without an account arrive too. The database fills in user_id
 * for signed-in people. Nobody can read others' notes from the app.
 */
export class SupabaseFeedbackService implements IFeedbackService {
  readonly central = true

  async send(body: string, context: FeedbackContext): Promise<void> {
    const { error } = await supabase.from('mem_feedback').insert({
      body,
      context: {
        tool: context.tool,
        skitTitle: context.skitTitle?.slice(0, 200),
        env: import.meta.env.VITE_VERCEL_ENV ?? (import.meta.env.DEV ? 'local' : 'unknown'),
        commit: (import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA ?? '').slice(0, 7) || undefined,
        path: window.location.pathname,
      },
    })
    if (error) throw error
    recordSentNote(body)
  }

  history(): SentNote[] {
    return loadSentNotes()
  }
}
