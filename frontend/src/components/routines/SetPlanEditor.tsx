import { useTranslation } from 'react-i18next'
import type { SetPlanEntry } from '../../types/routine'
import { MAX_SETS, addSet, copyPreviousSet, removeSet, updateSet } from '../../utils/setPlan'

interface Props {
  plan: SetPlanEntry[]
  onChange: (plan: SetPlanEntry[]) => void
  /** Prefijo para los id/aria de los inputs (único por ejercicio). */
  idPrefix: string
  className?: string
}

function toNum(raw: string): number | null {
  if (raw.trim() === '') return null
  const n = Number(raw.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

const iconBtn =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-neutral-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:hover:bg-white/5'

/** Una fila por serie: nº, repeticiones y peso (kg), con copiar la anterior y quitar. */
export default function SetPlanEditor({ plan, onChange, idPrefix, className }: Props) {
  const { t } = useTranslation()

  return (
    <div className={className}>
      <div className="mb-1 grid grid-cols-[2rem_1fr_1fr_5.25rem] items-end gap-2 text-center text-xs font-medium text-neutral-400">
        <span>{t('routines.setShort')}</span>
        <span className="capitalize">{t('common.reps')}</span>
        <span>{t('routines.weight')}</span>
        <span aria-hidden="true" />
      </div>
      <ul className="space-y-2">
        {plan.map((s, i) => (
          <li key={i} className="grid grid-cols-[2rem_1fr_1fr_5.25rem] items-center gap-2">
            <span className="text-center text-sm font-bold tabular-nums text-accent">{i + 1}</span>
            <input
              type="number" min={1} max={999} inputMode="numeric"
              aria-label={t('routines.setReps', { n: i + 1 })}
              id={`${idPrefix}-reps-${i}`}
              value={s.reps ?? ''}
              onChange={e => onChange(updateSet(plan, i, { reps: toNum(e.target.value) }))}
              placeholder="—"
              className="form-input form-input-dark min-w-0 text-center tabular-nums !py-2"
            />
            <input
              type="number" min={0} max={1000} step={0.5} inputMode="decimal"
              aria-label={t('routines.setWeight', { n: i + 1 })}
              id={`${idPrefix}-kg-${i}`}
              value={s.weight_kg ?? ''}
              onChange={e => onChange(updateSet(plan, i, { weight_kg: toNum(e.target.value) }))}
              placeholder="—"
              className="form-input form-input-dark min-w-0 text-center tabular-nums !py-2"
            />
            <div className="flex justify-end gap-1">
              <button
                type="button"
                onClick={() => onChange(copyPreviousSet(plan, i))}
                disabled={i === 0}
                aria-label={t('routines.copyPrevious', { n: i + 1 })}
                title={t('routines.copyPreviousShort')}
                className={iconBtn}
              >
                <i aria-hidden="true" className="bi bi-files" />
              </button>
              <button
                type="button"
                onClick={() => onChange(removeSet(plan, i))}
                disabled={plan.length <= 1}
                aria-label={t('routines.removeSet', { n: i + 1 })}
                className={iconBtn}
              >
                <i aria-hidden="true" className="bi bi-x-lg" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onChange(addSet(plan))}
        disabled={plan.length >= MAX_SETS}
        className="btn-ghost-dark mt-3 px-4 py-2 text-xs disabled:opacity-50"
      >
        <i aria-hidden="true" className="bi bi-plus-lg mr-1.5" />{t('routines.addSet')}
      </button>
    </div>
  )
}
