import { useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ErrorState from './ErrorState'

// errorElement de las rutas: errores de render o fallos al descargar un chunk
export default function RouteError() {
  const { t } = useTranslation()
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <ErrorState
        message={notFound ? t('common.notFound') : t('common.errorGeneric')}
        onRetry={() => window.location.reload()}
      />
    </div>
  )
}
