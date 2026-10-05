import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'

interface Props {
  message?: string
  onRetry?: () => void
  className?: string
}

export default function ErrorState({ message, onRetry, className }: Props) {
  const { t } = useTranslation()
  return (
    <div role="alert" className={cn('flex flex-col items-center gap-3 py-12 text-center', className)}>
      <p className="text-sm font-semibold text-red-500">{message ?? t('common.errorGeneric')}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-primary px-5 py-2 text-sm">
          {t('common.retry')}
        </button>
      )}
    </div>
  )
}
