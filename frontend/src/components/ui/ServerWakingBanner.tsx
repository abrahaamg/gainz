import { useTranslation } from 'react-i18next'
import { useServerStatusStore } from '../../store/useServerStatusStore'

/** Aviso fijo cuando el servidor tarda en responder (arranque en frío del backend gratuito). */
export default function ServerWakingBanner() {
  const { t } = useTranslation()
  const waking = useServerStatusStore(s => s.waking)
  if (!waking) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[100] mx-auto max-w-md rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-neutral-200 shadow-lg"
    >
      <i aria-hidden="true" className="bi bi-hourglass-split mr-2 text-accent" />
      {t('common.serverWaking')}
    </div>
  )
}
