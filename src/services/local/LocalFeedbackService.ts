import type { IFeedbackService, FeedbackContext, SentNote } from '@/services/types'
import { loadSentNotes, recordSentNote } from './feedbackHistory'

/**
 * Without Supabase configured, notes are only kept on this device.
 * They are never uploaded later.
 */
export class LocalFeedbackService implements IFeedbackService {
  readonly central = false

  async send(body: string, _context: FeedbackContext): Promise<void> {
    recordSentNote(body)
  }

  history(): SentNote[] {
    return loadSentNotes()
  }
}
