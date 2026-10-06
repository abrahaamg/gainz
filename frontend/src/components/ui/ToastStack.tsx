import { cn } from '../../lib/utils'

export interface ToastItem {
  id: string
  /** Clase de bootstrap-icons, p. ej. "bi-trophy-fill" */
  icon: string
  text: string
  /** "accent" resalta (PR); "neutral" es informativo */
  tone?: 'accent' | 'neutral'
}

/**
 * Contenedor único de avisos efímeros: apilados arriba, entrada de 300 ms sin bucle.
 * La región aria-live existe siempre para que los lectores de pantalla anuncien los avisos nuevos.
 */
export default function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-[calc(env(safe-area-inset-top)+1rem)] inset-x-4 z-50 mx-auto flex max-w-md flex-col gap-2 pointer-events-none"
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={cn(
            'animate-toast-in flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold shadow-modal',
            toast.tone === 'accent'
              ? 'bg-accent text-neutral-900'
              : 'bg-surface-3 border border-accent/40 text-white',
          )}
        >
          <i aria-hidden="true" className={cn('bi', toast.icon)} />
          {toast.text}
        </div>
      ))}
    </div>
  )
}
