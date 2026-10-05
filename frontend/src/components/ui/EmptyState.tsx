import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface EmptyStateProps {
  /** Clase de bootstrap-icons, p. ej. "bi-journal-plus" */
  icon: string
  title: string
  description?: string
  /** Botón o enlace de acción (CTA) */
  action?: ReactNode
  /** Sin contenedor propio: para usarlo dentro de una tarjeta que ya existe */
  bare?: boolean
  /** Aspecto de error (icono rojo). Lo usa ErrorState. */
  tone?: 'neutral' | 'error'
  role?: 'alert' | 'status'
  className?: string
}

/** Estado vacío (y base del estado de error): icono, título, texto opcional y acción. */
export default function EmptyState({
  icon, title, description, action, bare = false, tone = 'neutral', role, className,
}: EmptyStateProps) {
  return (
    <div
      role={role}
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-center px-5 py-10',
        !bare && 'glow-card rounded-apple border-dashed !border-white/10',
        className,
      )}
    >
      <i
        aria-hidden="true"
        className={cn('bi text-3xl', icon, tone === 'error' ? 'text-red-400' : 'text-neutral-400')}
      />
      <div className="max-w-sm">
        <p className={cn('text-sm font-semibold', tone === 'error' ? 'text-red-400' : 'text-white')}>
          {title}
        </p>
        {description && <p className="mt-1 text-sm text-neutral-400">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
