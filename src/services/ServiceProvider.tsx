import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react'
import type {
  ISkitService,
  IProgressService,
  IUserService,
  IStarService,
  IGoalService,
  ITaskService,
  ILadderService,
  IFeedbackService,
} from '@/services/types'

// Local implementations
import { LocalSkitService } from '@/services/local/LocalSkitService'
import { ApiProgressService } from '@/services/ApiProgressService'
import { LocalUserService } from '@/services/local/LocalUserService'
import { LocalStarService } from '@/services/local/LocalStarService'
import { LocalGoalService } from '@/services/local/LocalGoalService'
import { LocalTaskService } from '@/services/local/LocalTaskService'
import { LocalLadderService } from '@/services/local/LocalLadderService'
import { LocalFeedbackService } from '@/services/local/LocalFeedbackService'

// Supabase implementations
import { SupabaseSkitService } from '@/services/supabase/SupabaseSkitService'
import { SupabaseProgressService } from '@/services/supabase/SupabaseProgressService'
import { SupabaseUserService } from '@/services/supabase/SupabaseUserService'
import { SupabaseStarService } from '@/services/supabase/SupabaseStarService'
import { SupabaseGoalService } from '@/services/supabase/SupabaseGoalService'
import { SupabaseTaskService } from '@/services/supabase/SupabaseTaskService'
import { SupabaseLadderService } from '@/services/supabase/SupabaseLadderService'
import { SupabaseFeedbackService } from '@/services/supabase/SupabaseFeedbackService'

import { isSupabaseAvailable, supabase } from '@/services/supabase/client'

export interface Services {
  skitService: ISkitService
  progressService: IProgressService
  userService: IUserService
  starService: IStarService
  goalService: IGoalService
  taskService: ITaskService
  ladderService: ILadderService
  feedbackService: IFeedbackService
  isOnline: boolean
}

const ServiceContext = createContext<Services | null>(null)

export function useServices(): Services {
  const ctx = useContext(ServiceContext)
  if (!ctx) throw new Error('useServices must be used within ServiceProvider')
  return ctx
}

// Feedback reaches the shared list whenever Supabase is configured, signed in or not
function createFeedbackService(): IFeedbackService {
  return isSupabaseAvailable ? new SupabaseFeedbackService() : new LocalFeedbackService()
}

function createLocalServices(): Services {
  return {
    skitService: new LocalSkitService(),
    progressService: new ApiProgressService(),
    userService: new LocalUserService(),
    starService: new LocalStarService(),
    goalService: new LocalGoalService(),
    taskService: new LocalTaskService(),
    ladderService: new LocalLadderService(),
    feedbackService: createFeedbackService(),
    isOnline: false,
  }
}

function createSupabaseServices(): Services {
  return {
    skitService: new SupabaseSkitService(),
    progressService: new SupabaseProgressService(),
    userService: new SupabaseUserService(),
    starService: new SupabaseStarService(),
    goalService: new SupabaseGoalService(),
    taskService: new SupabaseTaskService(),
    ladderService: new SupabaseLadderService(),
    feedbackService: createFeedbackService(),
    isOnline: true,
  }
}

export function ServiceProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (!isSupabaseAvailable) return

    // Check initial auth state
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthenticated(!!data.session)
    })

    // Listen for auth changes so services swap live on login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const services = useMemo<Services>(() => {
    // Supabase configured + user authenticated → cloud services
    if (isSupabaseAvailable && isAuthenticated) {
      return createSupabaseServices()
    }
    // Otherwise → local services (works offline, no env vars, or not logged in)
    return createLocalServices()
  }, [isAuthenticated])

  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  )
}
