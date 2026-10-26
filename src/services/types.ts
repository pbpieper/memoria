import type { Skit } from '@/types/skit'
import type { SkitProgress, ProgressExport } from '@/types/progress'
import type { User } from '@/types/user'
import type { LearningGoal, DailyTask, SkitStreak } from '@/types/goals'
import type { LadderProgress, ChallengeAttempt } from '@/types/ladder'

export interface ISkitService {
  listSkits(): Promise<Skit[]>
  getSkit(id: string): Promise<Skit | null>
  createSkit(skit: Omit<Skit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Skit>
  updateSkit(id: string, patch: Partial<Skit>): Promise<Skit>
  deleteSkit(id: string): Promise<void>
}

export interface IProgressService {
  getProgress(userId: string, skitId: string): Promise<SkitProgress>
  saveProgress(userId: string, skitId: string, progress: SkitProgress): Promise<void>
  exportProgress(userId: string): Promise<ProgressExport>
}

export interface IUserService {
  getCurrentUser(): Promise<User>
  createUser(name: string): Promise<User>
  updatePreferences(userId: string, prefs: Partial<User['preferences']>): Promise<void>
}

export interface IStarService {
  getStarred(userId: string): Promise<string[]>
  star(userId: string, skitId: string): Promise<void>
  unstar(userId: string, skitId: string): Promise<void>
  isStarred(userId: string, skitId: string): Promise<boolean>
}

export interface IGoalService {
  getGoals(userId: string): Promise<LearningGoal[]>
  getGoalForSkit(userId: string, skitId: string): Promise<LearningGoal | null>
  createGoal(goal: Omit<LearningGoal, 'id' | 'createdAt' | 'updatedAt'>): Promise<LearningGoal>
  updateGoal(goalId: string, patch: Partial<LearningGoal>): Promise<LearningGoal>
  deleteGoal(goalId: string): Promise<void>
}

export interface ITaskService {
  getTasksForDate(userId: string, date: string): Promise<DailyTask[]>
  getTasksForSkit(userId: string, skitId: string, date: string): Promise<DailyTask[]>
  completeTask(taskId: string): Promise<DailyTask>
  uncompleteTask(taskId: string): Promise<DailyTask>
  saveTasks(tasks: DailyTask[]): Promise<void>
  getStreak(userId: string, skitId: string): Promise<SkitStreak>
  updateStreak(userId: string, skitId: string): Promise<SkitStreak>
}

export interface ILadderService {
  getLadderProgress(userId: string, skitId: string): Promise<LadderProgress>
  saveLadderProgress(userId: string, skitId: string, progress: LadderProgress): Promise<void>
  recordChallengeAttempt(attempt: Omit<ChallengeAttempt, 'id'>): Promise<ChallengeAttempt>
  getChallengeHistory(userId: string, skitId: string): Promise<ChallengeAttempt[]>
}

/** Where a feedback note was written from, so it can be read later without asking. */
export interface FeedbackContext {
  tool?: string
  skitTitle?: string
}

/** A note this device sent, kept so the person can see what they already said. */
export interface SentNote {
  body: string
  at: string
}

/** Longest note the shared list accepts (matches the database check). */
export const FEEDBACK_MAX_CHARS = 4000

export interface IFeedbackService {
  /** True when notes reach the shared feedback list; false when they stay on this device. */
  readonly central: boolean
  send(body: string, context: FeedbackContext): Promise<void>
  /** Notes sent from this device, oldest first. */
  history(): SentNote[]
}
