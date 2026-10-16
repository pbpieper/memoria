import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/design/theme'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { ServiceProvider } from '@/services/ServiceProvider'
import { UserProvider } from '@/context/UserContext'
import { StarProvider } from '@/context/StarContext'
import { AppProvider } from '@/context/AppContext'
import { SkitProvider } from '@/context/SkitContext'
import { ProgressProvider } from '@/context/ProgressContext'
import { GoalProvider } from '@/context/GoalContext'
import { LadderProvider } from '@/context/LadderContext'
import { AppShell } from '@/components/layout/AppShell'
import { UpdateBanner } from '@/components/molecules/UpdateBanner'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthGuard>
          <ServiceProvider>
            <UserProvider>
              <StarProvider>
                <AppProvider>
                  <SkitProvider>
                    <ProgressProvider>
                      <GoalProvider>
                        <LadderProvider>
                          <AppShell />
                          <UpdateBanner />
                          <Toaster position="bottom-center" toastOptions={{ duration: 2000 }} />
                        </LadderProvider>
                      </GoalProvider>
                    </ProgressProvider>
                  </SkitProvider>
                </AppProvider>
              </StarProvider>
            </UserProvider>
          </ServiceProvider>
        </AuthGuard>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
