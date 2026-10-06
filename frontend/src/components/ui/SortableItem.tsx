import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '../../lib/utils'

interface SortableItemProps {
  id: number | string
  /** Texto accesible del asa, p. ej. "Arrastrar Press de banca" */
  handleLabel: string
  /** Recibe el asa ya montada para colocarla donde toque dentro del elemento */
  children: (handle: ReactNode) => ReactNode
  className?: string
}

/**
 * Elemento reordenable con dnd-kit que solo se arrastra desde su asa: así el
 * resto de la tarjeta se puede pulsar y, en móvil, deslizar el dedo fuera del
 * asa hace scroll normal (el asa lleva touch-action: none).
 */
export default function SortableItem({ id, handleLabel, children, className }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      onClick={e => e.preventDefault()}
      aria-label={handleLabel}
      className="flex min-h-[44px] min-w-[44px] shrink-0 touch-none items-center justify-center rounded-xl text-lg text-neutral-400 cursor-grab hover:text-accent active:cursor-grabbing"
    >
      <i aria-hidden="true" className="bi bi-grip-vertical" />
    </button>
  )

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'relative z-10 opacity-60', className)}
    >
      {children(handle)}
    </div>
  )
}
