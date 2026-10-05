import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'

export default function Spinner({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <div role="status" className="inline-flex">
      <div className={cn('w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin', className)} />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  )
}
