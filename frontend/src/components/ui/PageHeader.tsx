import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface PageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  /** Elemento a la izquierda del título (p. ej. avatar) */
  leading?: ReactNode
  /** Botones o controles a la derecha (debajo del título en móvil) */
  actions?: ReactNode
  className?: string
}

/** Cabecera de página: título, subtítulo y acciones. Apilada en móvil, en fila desde sm. */
export default function PageHeader({ title, subtitle, leading, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'card header-gradient border-none mb-6 sm:mb-8 px-5 py-6 sm:px-8 sm:py-8',
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
        className,
      )}
    >
      <div className="relative z-10 flex min-w-0 items-center gap-4">
        {leading}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-neutral-400 mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="relative z-10 flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
