import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../ui/Modal'
import GlowCard from '../ui/GlowCard'
import { MAX_DAYS } from '../../utils/routineImport/days'
import { DEFAULT_SPLIT, type SplitGroup, type SplitOptions } from '../../utils/routineImport/plan'

interface DayOption {
  key: string
  name: string
  unassigned?: boolean
}

const GROUPS: SplitGroup[] = ['pull', 'push', 'legs']

// ── Quitar un día con ejercicios: moverlos a otro día o descartarlos

interface RemoveProps {
  /** Día a quitar; null = cerrado. */
  day: (DayOption & { rowCount: number }) | null
  others: DayOption[]
  onClose: () => void
  onConfirm: (moveToKey: string | null) => void
}

export function RemoveDayModal({ day, others, onClose, onConfirm }: RemoveProps) {
  return (
    <Modal open={day !== null} onClose={onClose} labelledBy="remove-day-title" placement="sheet">
      {day && <RemoveForm key={day.key} day={day} others={others} onClose={onClose} onConfirm={onConfirm} />}
    </Modal>
  )
}

function RemoveForm({ day, others, onClose, onConfirm }: Omit<RemoveProps, 'day'> & { day: NonNullable<RemoveProps['day']> }) {
  const { t } = useTranslation()
  const uid = useId()
  const canMove = others.length > 0
  const [action, setAction] = useState<'move' | 'discard'>(canMove ? 'move' : 'discard')
  const [target, setTarget] = useState(others[0]?.key ?? '')
  const label = (d: DayOption) => (d.unassigned ? t('routineImport.unassigned') : d.name || t('routineImport.unnamedDay'))

  return (
    <GlowCard className="rounded-b-none sm:rounded-b-apple">
      <form
        className="flex flex-col gap-4 p-5"
        onSubmit={e => {
          e.preventDefault()
          onConfirm(action === 'move' ? target : null)
        }}
      >
        <div>
          <h2 id="remove-day-title" className="text-lg font-bold text-white">
            {t('routineImport.removeModal.title', { name: day.name || t('routineImport.unnamedDay') })}
          </h2>
          <p className="mt-1 text-sm text-neutral-400">{t('routineImport.removeModal.help', { count: day.rowCount })}</p>
        </div>

        <fieldset className="space-y-3">
          <legend className="sr-only">{t('routineImport.removeModal.legend')}</legend>
          {canMove && (
            <div>
              <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-sm text-neutral-200">
                <input
                  type="radio" name={`${uid}-action`} className="h-4 w-4 accent-accent"
                  checked={action === 'move'} onChange={() => setAction('move')}
                />
                {t('routineImport.removeModal.move')}
              </label>
              <label htmlFor={`${uid}-target`} className="sr-only">{t('routineImport.removeModal.target')}</label>
              <select
                id={`${uid}-target`} value={target} disabled={action !== 'move'}
                onChange={e => setTarget(e.target.value)}
                className="form-input form-input-dark mt-1 disabled:opacity-50"
              >
                {others.map(d => <option key={d.key} value={d.key}>{label(d)}</option>)}
              </select>
            </div>
          )}
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-sm text-neutral-200">
            <input
              type="radio" name={`${uid}-action`} className="h-4 w-4 accent-accent"
              checked={action === 'discard'} onChange={() => setAction('discard')}
            />
            {t('routineImport.removeModal.discard')}
          </label>
        </fieldset>

        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost-dark">{t('common.cancel')}</button>
          <button type="submit" className="btn-primary">{t('routineImport.removeModal.confirm')}</button>
        </div>
      </form>
    </GlowCard>
  )
}

// ── Repartir por músculo: cuántos días y en cuál va cada grupo

interface SplitProps {
  open: boolean
  /** Nº de días reales actuales (para avisar de cuántos se crearán). */
  currentDays: number
  onClose: () => void
  onConfirm: (options: SplitOptions) => void
}

export function SplitModal({ open, currentDays, onClose, onConfirm }: SplitProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="split-title" placement="sheet">
      {open && <SplitForm currentDays={currentDays} onClose={onClose} onConfirm={onConfirm} />}
    </Modal>
  )
}

function SplitForm({ currentDays, onClose, onConfirm }: Omit<SplitProps, 'open'>) {
  const { t } = useTranslation()
  const uid = useId()
  const [dayCount, setDayCount] = useState(Math.min(MAX_DAYS, Math.max(DEFAULT_SPLIT.dayCount, currentDays)))
  const [groupDays, setGroupDays] = useState(DEFAULT_SPLIT.groupDays)
  const dayOf = (g: SplitGroup) => Math.min(groupDays[g], dayCount)
  const toCreate = Math.max(0, dayCount - currentDays)
  const numbers = (max: number) => Array.from({ length: max }, (_, i) => i + 1)

  return (
    <GlowCard className="rounded-b-none sm:rounded-b-apple">
      <form
        className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto p-5"
        onSubmit={e => {
          e.preventDefault()
          onConfirm({ dayCount, groupDays: { pull: dayOf('pull'), push: dayOf('push'), legs: dayOf('legs') } })
        }}
      >
        <div>
          <h2 id="split-title" className="text-lg font-bold text-white">{t('routineImport.splitModal.title')}</h2>
          <p className="mt-1 text-sm text-neutral-400">{t('routineImport.splitModal.help')}</p>
        </div>

        <div>
          <label htmlFor={`${uid}-count`} className="form-label">{t('routineImport.splitModal.days')}</label>
          <select
            id={`${uid}-count`} value={dayCount} onChange={e => setDayCount(Number(e.target.value))}
            className="form-input form-input-dark"
          >
            {numbers(MAX_DAYS).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          {toCreate > 0 && (
            <p className="mt-1 text-xs text-neutral-400">{t('routineImport.splitModal.willCreate', { count: toCreate })}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {GROUPS.map(g => (
            <div key={g}>
              <label htmlFor={`${uid}-${g}`} className="form-label">{t(`routineImport.splitModal.groups.${g}`)}</label>
              <select
                id={`${uid}-${g}`} value={dayOf(g)}
                onChange={e => setGroupDays(prev => ({ ...prev, [g]: Number(e.target.value) }))}
                className="form-input form-input-dark"
              >
                {numbers(dayCount).map(n => <option key={n} value={n}>{t('routineImport.splitModal.dayN', { n })}</option>)}
              </select>
            </div>
          ))}
        </div>

        <p className="text-xs text-neutral-400">{t('routineImport.splitModal.note')}</p>

        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost-dark">{t('common.cancel')}</button>
          <button type="submit" className="btn-primary">{t('routineImport.splitModal.confirm')}</button>
        </div>
      </form>
    </GlowCard>
  )
}
