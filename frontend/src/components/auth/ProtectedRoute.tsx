import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const DEV_MODE = !import.meta.env.VITE_FIREBASE_PROJECT_ID

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { firebaseUser, loading } = useAuth()

  // Sin Firebase configurado → modo DEV, acceso libre (igual que el backend)
  if (DEV_MODE) return <>{children}</>

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
