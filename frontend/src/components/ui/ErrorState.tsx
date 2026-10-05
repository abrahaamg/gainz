import { useTranslation } from 'react-i18next'
import EmptyState from './EmptyState'

interface Props {
  message?: string
  onRetry?: () => void
  className?: string
  /** Sin contenedor propio (dentro de una tarjeta) */
  bare?: boolean
}

/** Error con reintento. Comparte aspecto con EmptyState. */
export default function ErrorState({ message, onRetry, className, bare }: Props) {
  const { t } = useTranslation()
  return (
    <EmptyState
      role="alert"
      tone="error"
      icon="bi-exclamation-triangle"
      title={message ?? t('common.errorGeneric')}
      bare={bare}
      className={className}
      action={onRetry && (
        <button type="button" onClick={onRetry} className="btn-primary">
          {t('common.retry')}
        </button>
      )}
    />
  )
}
