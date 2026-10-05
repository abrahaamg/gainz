import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface ModalProps {
  open: boolean
  /** Se llama con Escape. El padre decide si cierra. */
  onClose: () => void
  /** id del elemento que titula el diálogo (aria-labelledby). */
  labelledBy: string
  children: ReactNode
  /** "sheet": en móvil sube desde abajo como bottom-sheet; desde sm, centrado. */
  placement?: 'center' | 'sheet'
  /** Clases extra para el contenedor del diálogo (p. ej. max-h con scroll). */
  className?: string
}

/**
 * Diálogo modal accesible: role="dialog" + aria-modal, cierra con Escape,
 * atrapa el foco con Tab y lo devuelve al elemento previo al cerrar.
 */
export default function Modal({ open, onClose, labelledBy, children, className, placement = 'center' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    const first = dialog?.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? dialog)?.focus()
    return () => previouslyFocused?.focus?.()
  }, [open])

  if (!open) return null

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onCloseRef.current()
      return
    }
    if (e.key !== 'Tab') return
    const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
    if (items.length === 0) {
      e.preventDefault()
      return
    }
    const firstItem = items[0]
    const lastItem = items[items.length - 1]
    const active = document.activeElement
    if (e.shiftKey && (active === firstItem || active === dialogRef.current)) {
      e.preventDefault()
      lastItem.focus()
    } else if (!e.shiftKey && active === lastItem) {
      e.preventDefault()
      firstItem.focus()
    }
  }

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center z-50',
        placement === 'sheet' ? 'items-end sm:items-center p-0 sm:p-4' : 'items-center p-4',
      )}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full max-w-md outline-none',
          placement === 'sheet' && 'max-w-none sm:max-w-md max-h-[92vh] overflow-y-auto animate-sheet-in sm:animate-none pb-[env(safe-area-inset-bottom)] rounded-t-apple sm:rounded-b-apple',
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
