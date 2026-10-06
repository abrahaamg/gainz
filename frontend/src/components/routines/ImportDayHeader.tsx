import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  dayKey: string
  name: string
  rowCount: number
  skipped: boolean
  isFirst: boolean
  isLast: boolean
  /** Enfoca el nombre al montarse (día recién añadido). */
  autoFocus?: boolean
  onRename: (name: string) => void
  onMove: (delta: -1 | 1) => void
  onToggleSkip: () => void
  onRemove: () => void
}

const menuItem =
  'flex min-h-[44px] w-full items-center gap-2.5 px-4 text-left text-sm text-neutral-200 transition-colors hover:bg-white/10 focus-visible:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent'

/** Cabecera de un día del paso Revisar: nombre editable, nº de ejercicios y menú "⋯" con las acciones del día. */
export default function ImportDayHeader({
  dayKey, name, rowCount, skipped, isFirst, isLast, autoFocus, onRename, onMove, onToggleSkip, onRemove,
}: Props) {
  const { t } = useTranslation()
  const uid = useId()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const act = (fn: () => void) => () => {
    setOpen(false)
    fn()
  }
  const label = name || t('routineImport.unnamedDay')

  return (
    <div className="space-y-1.5">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={`day-name-${dayKey}`} className="form-label">{t('routineImport.dayName')}</label>
          <input
            id={`day-name-${dayKey}`}
            value={name}
            onChange={e => onRename(e.target.value)}
            maxLength={100}
            autoFocus={autoFocus}
            className="form-input font-bold"
          />
        </div>
        <div ref={wrapRef} className="relative shrink-0">
          <button
            ref={triggerRef}
            type="button"
            aria-haspopup="true"
            aria-expanded={open}
            aria-controls={`${uid}-menu`}
            aria-label={t('routineImport.dayActions', { name: label })}
            onClick={() => setOpen(o => !o)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-neutral-900 text-neutral-200 transition-colors hover:bg-neutral-800 hover:text-white"
          >
            <i aria-hidden="true" className="bi bi-three-dots" />
          </button>
          {open && (
            <div
              id={`${uid}-menu`}
              className="absolute right-0 top-full z-[45] mt-1 w-56 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 py-1 shadow-lg"
            >
              <button type="button" className={menuItem} disabled={isFirst} onClick={act(() => onMove(-1))}>
                <i aria-hidden="true" className="bi bi-arrow-up" />{t('routineImport.moveDayUp')}
              </button>
              <button type="button" className={menuItem} disabled={isLast} onClick={act(() => onMove(1))}>
                <i aria-hidden="true" className="bi bi-arrow-down" />{t('routineImport.moveDayDown')}
              </button>
              <button type="button" className={menuItem} onClick={act(onToggleSkip)}>
                <i aria-hidden="true" className={`bi ${skipped ? 'bi-check-circle' : 'bi-slash-circle'}`} />
                {skipped ? t('routineImport.importDay') : t('routineImport.skipDay')}
              </button>
              <button type="button" className={`${menuItem} !text-red-400`} onClick={act(onRemove)}>
                <i aria-hidden="true" className="bi bi-trash3" />{t('routineImport.removeDay')}
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[color:var(--text-muted)]">
        <span>{t('routineImport.dayRows', { count: rowCount })}</span>
        {rowCount === 0 && !skipped && (
          <span className="font-semibold text-amber-300">
            <i aria-hidden="true" className="bi bi-info-circle mr-1" />{t('routineImport.willBeEmpty')}
          </span>
        )}
      </p>
    </div>
  )
}
