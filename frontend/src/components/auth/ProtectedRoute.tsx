import { Navigate } from 'react-router-dom'
import { useLogout } from '../../hooks/useAuth'
import { useAuthStore } from '../../store/useAuthStore'
import { AUTH_CONFIG_MISSING, DEV_MODE } from '../../config/authMode'
import Spinner from '../ui/Spinner'
import ErrorState from '../ui/ErrorState'
import { useTranslation } from 'react-i18next'

interface Props {
  children: React.ReactNode
  /** Permite entrar sin onboarding completado (solo para /onboarding). */
  allowIncompleteOnboarding?: boolean
}

export default function ProtectedRoute({ children, allowIncompleteOnboarding = false }: Props) {
  const { t } = useTranslation()
  const { firebaseUser, mysqlUser, loading, authError, retryAuth } = useAuthStore()
  const logout = useLogout()

  if (AUTH_CONFIG_MISSING) return <Navigate to="/login" replace />

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  // Sin sesión de Firebase → login (en DEV no se exige Firebase)
  if (!DEV_MODE && !firebaseUser) {
    return <Navigate to="/login" replace />
  }

  // Sesión válida pero el perfil no se pudo cargar: error con reintento, no se abre la app
  if (!mysqlUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <ErrorState message={authError ? t('auth.profileLoadError') : t('common.errorGeneric')} onRetry={retryAuth} />
        {!DEV_MODE && (
          <button type="button" onClick={logout} className="text-xs text-neutral-500 underline hover:text-accent">
            {t('nav.logout')}
          </button>
        )}
      </div>
    )
  }

  if (!mysqlUser.onboarding_done && !allowIncompleteOnboarding) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
