import { useTranslation } from 'react-i18next'
import GlowCard from '../ui/GlowCard'
import SetPlanEditor from './SetPlanEditor'
import type { DraftRow } from '../../utils/routineImport/draft'
import type { RowWarning } from '../../utils/routineImport/parse'
import type { SetPlanEntry } from '../../types/routine'
import { label } from '../../utils/labels'

interface DayOption {
  key: string
  name: string
}

interface Props {
  row: DraftRow
  index: number
  count: number
  days: DayOption[]
  dayKey: string
  onPlanChange: (plan: SetPlanEntry[]) => void
  onNotesChange: (notes: string) => void
  onPickExercise: () => void
  onSwap: () => void
  onDismissWarning: (w: RowWarning) => void
  onMove: (delta: -1 | 1) => void
  onMoveToDay: (dayKey: string) => void
  onRemove: () => void
}

const iconBtn =
  'flex h-10 w-10 items-center justify-center rounded-xl text-neutral-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent'

/** Fila del paso "Revisar": ejercicio emparejado, series por serie, notas y avisos. */
export default function ImportRowCard({
  row, index, count, days, dayKey, onPlanChange, onNotesChange, onPickExercise, onSwap,
  onDismissWarning, onMove, onMoveToDay, onRemove,
}: Props) {
  const { t } = useTranslation()
  const resolved = row.exercise !== null
  const otherDays = days.filter(d => d.key !== dayKey)

  return (
    <GlowCard className={resolved ? undefined : '!border-amber-500/40'}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-neutral-400">{t('routineImport.original')}</p>
            <p className="break-words text-sm font-semibold uppercase tracking-wide text-neutral-300">{row.rawName}</p>
          </div>
          <div className="flex shrink-0 gap-0.5">
            <button
              type="button" onClick={() => onMove(-1)} disabled={index === 0}
              aria-label={t('routines.moveUp', { name: row.rawName })} className={iconBtn}
            ><i aria-hidden="true" className="bi bi-arrow-up" /></button>
            <button
              type="button" onClick={() => onMove(1)} disabled={index === count - 1}
              aria-label={t('routines.moveDown', { name: row.rawName })} className={iconBtn}
            ><i aria-hidden="true" className="bi bi-arrow-down" /></button>
            <button
              type="button" onClick={onRemove}
              aria-label={t('routines.removeExercise', { name: row.rawName })}
              className={`${iconBtn} !text-red-400 hover:!text-red-300`}
            ><i aria-hidden="true" className="bi bi-trash3" /></button>
          </div>
        </div>

        {/* Ejercicio del catálogo */}
        <button
          type="button"
          onClick={onPickExercise}
          className={
            'mt-3 flex min-h-[48px] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-2 text-left transition-colors ' +
            (resolved
              ? 'border-white/10 bg-white/5 hover:bg-white/10'
              : 'border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/15')
          }
        >
          {resolved ? (
            <span className="min-w-0">
              <span className="block break-words text-sm font-bold text-white">{row.exercise!.name}</span>
              <span className="block text-xs text-neutral-400">{label('muscles', row.exercise!.muscle_group)}</span>
            </span>
          ) : (
            <span className="min-w-0">
              <span className="block text-sm font-bold text-amber-300">{t('routineImport.unmatched')}</span>
              <span className="block text-xs text-neutral-400">{t('routineImport.unmatchedHint')}</span>
            </span>
          )}
          <span className="shrink-0 text-xs font-semibold text-accent">
            {resolved ? t('routineImport.change') : t('routineImport.choose')}
          </span>
        </button>

        {/* Avisos */}
        {row.warnings.length > 0 && (
          <ul className="mt-3 space-y-2">
            {row.warnings.map(w => (
              <li
                key={w}
                className="flex flex-col gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-300 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="flex min-w-0 items-start gap-2 text-xs">
                  <i aria-hidden="true" className="bi bi-exclamation-triangle-fill mt-0.5" />
                  <span>{t(`routineImport.warnings.${w}`)}</span>
                </span>
                {w === 'swapped' ? (
                  <button type="button" onClick={onSwap} className="btn-ghost-dark shrink-0 justify-center px-3 py-1.5 text-xs">
                    <i aria-hidden="true" className="bi bi-arrow-left-right mr-1.5" />{t('routineImport.swap')}
                  </button>
                ) : (
                  <button type="button" onClick={() => onDismissWarning(w)} className="btn-ghost-dark shrink-0 justify-center px-3 py-1.5 text-xs">
                    {t('routineImport.dismiss')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <SetPlanEditor
          className="mt-4"
          plan={row.plan}
          onChange={onPlanChange}
          idPrefix={`imp-${row.key}`}
        />

        <div className="mt-3">
          <label htmlFor={`imp-notes-${row.key}`} className="form-label">{t('routineImport.notes')}</label>
          <input
            id={`imp-notes-${row.key}`}
            type="text"
            value={row.notes}
            onChange={e => onNotesChange(e.target.value)}
            className="form-input form-input-dark"
          />
        </div>

        {otherDays.length > 0 && (
          <div className="mt-3">
            <label htmlFor={`imp-day-${row.key}`} className="form-label">{t('routineImport.moveToDay')}</label>
            <select
              id={`imp-day-${row.key}`}
              value=""
              onChange={e => e.target.value && onMoveToDay(e.target.value)}
              className="form-input form-input-dark"
            >
              <option value="">{t('routineImport.keepInDay')}</option>
              {otherDays.map(d => <option key={d.key} value={d.key}>{d.name || t('routineImport.unnamedDay')}</option>)}
            </select>
          </div>
        )}
      </div>
    </GlowCard>
  )
}
