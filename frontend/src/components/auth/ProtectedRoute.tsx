import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const DEV_MODE = !import.meta.env.VITE_FIREBASE_PROJECT_ID

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { firebaseUser, mysqlUser, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Auth check (skip in DEV)
  if (!DEV_MODE && !firebaseUser) {
    return <Navigate to="/login" replace />
  }

  // Onboarding check — redirect if not completed (skip if already on /onboarding)
  if (mysqlUser && !mysqlUser.onboarding_done && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
