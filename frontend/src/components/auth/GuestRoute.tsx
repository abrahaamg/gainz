import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { DEV_MODE } from '../../config/authMode'
import Spinner from '../ui/Spinner'

// Rutas de invitado (/login, /register): si ya hay sesión completa redirige a la app.
// En DEV_MODE no redirige para poder probar el flujo de registro.
export default function GuestRoute({ children }: { children: React.ReactNode }) {
  const { firebaseUser, mysqlUser, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  if (!DEV_MODE && firebaseUser && mysqlUser) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
