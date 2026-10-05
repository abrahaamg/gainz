import { RouterProvider } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import router from './router'
import { useAuthInit } from './hooks/useAuth'
import { AUTH_CONFIG_MISSING } from './config/authMode'
import ErrorState from './components/ui/ErrorState'

function AppInner() {
  useAuthInit()
  return <RouterProvider router={router} />
}

export default function App() {
  const { t } = useTranslation()
  // Producción sin Firebase configurado: fallar en vez de abrir la app sin login
  if (AUTH_CONFIG_MISSING) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <ErrorState message={t('auth.configMissing')} />
      </div>
    )
  }
  return <AppInner />
}
