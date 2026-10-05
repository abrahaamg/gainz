import { cn } from '../../lib/utils'

interface SkeletonProps {
  className?: string
  /** "dark" para usarlo sobre tarjetas oscuras */
  tone?: 'light' | 'dark'
}

/** Bloque gris pulsante que reserva el espacio del contenido mientras carga. */
export default function Skeleton({ className, tone = 'light' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-2xl',
        tone === 'dark' ? 'bg-white/10' : 'bg-neutral-200 dark:bg-white/10',
        className,
      )}
    />
  )
}
