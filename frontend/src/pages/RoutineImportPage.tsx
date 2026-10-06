import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { routineService } from '../services/routineService'
import { apiErrorMessage } from '../utils/apiError'
import { useExerciseCatalog } from '../hooks/useExerciseCatalog'
import { parseRoutineText } from '../utils/routineImport/parse'
import { buildMatchIndex } from '../utils/routineImport/match'
import {
  buildDraft, canSave, dayToPayload, dismissWarning, moveRow, moveRowToDay, summarize, swapRow,
  type DraftDay, type DraftExercise, type DraftRow,
} from '../utils/routineImport/draft'
import { IMPORT_SAMPLE } from '../utils/routineImport/sample'
import GlowCard from '../components/ui/GlowCard'
import PageHeader from '../components/ui/PageHeader'
import ErrorState from '../components/ui/ErrorState'
import Spinner from '../components/ui/Spinner'
import ExercisePickerModal from '../components/routines/ExercisePickerModal'
import CreateOwnExercise from '../components/routines/CreateOwnExercise'
import ImportRowCard from '../components/routines/ImportRowCard'

type Step = 'paste' | 'review' | 'save'
type DayStatus = 'pending' | 'saving' | 'done' | 'error'

interface SaveState {
  statuses: Record<string, DayStatus>
  errors: Record<string, string>
}

const STEPS: Step[] = ['paste', 'review', 'save']

function toTitle(name: string): string {
  const lower = name.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

export default function RoutineImportPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { catalog, loading: catalogLoading, error: catalogError, reload, addToCatalog } = useExerciseCatalog()

  const [step, setStep] = useState<Step>('paste')
  const [text, setText] = useState('')
  const [pasteError, setPasteError] = useState<string | null>(null)
  const [days, setDays] = useState<DraftDay[]>([])
  const [picker, setPicker] = useState<{ dayKey: string; rowKey: string } | null>(null)
  const [save, setSave] = useState<SaveState>({ statuses: {}, errors: {} })
  const [saving, setSaving] = useState(false)

  const draftCatalog: DraftExercise[] = catalog
  const matchIndex = useMemo(() => buildMatchIndex(draftCatalog), [draftCatalog])
  const summary = summarize(days)
  const pickerRow = picker ? days.find(d => d.key === picker.dayKey)?.rows.find(r => r.key === picker.rowKey) : undefined

  // ── Paso 1: analizar
  const analyze = () => {
    const parsed = parseRoutineText(text)
    if (parsed.days.length === 0) {
      setPasteError(t('routineImport.nothingFound'))
      return
    }
    setPasteError(null)
    setDays(buildDraft(parsed, draftCatalog, matchIndex))
    setSave({ statuses: {}, errors: {} })
    setStep('review')
  }

  // ── Paso 2: ediciones del borrador
  const updateDay = (dayKey: string, fn: (d: DraftDay) => DraftDay) =>
    setDays(prev => prev.map(d => (d.key === dayKey ? fn(d) : d)))

  const updateRow = (dayKey: string, rowKey: string, fn: (r: DraftRow) => DraftRow) =>
    updateDay(dayKey, d => ({ ...d, rows: d.rows.map(r => (r.key === rowKey ? fn(r) : r)) }))

  const removeRow = (dayKey: string, rowKey: string) =>
    updateDay(dayKey, d => ({ ...d, rows: d.rows.filter(r => r.key !== rowKey) }))

  const removeDay = (dayKey: string) => {
    const day = days.find(d => d.key === dayKey)
    if (day && day.rows.length > 0 && !confirm(t('routineImport.deleteDayConfirm', { name: day.name }))) return
    setDays(prev => prev.filter(d => d.key !== dayKey))
  }

  const moveToDay = (fromKey: string, rowKey: string, toKey: string) =>
    setDays(prev => {
      const from = prev.findIndex(d => d.key === fromKey)
      const to = prev.findIndex(d => d.key === toKey)
      const rowIndex = prev[from]?.rows.findIndex(r => r.key === rowKey) ?? -1
      return rowIndex < 0 ? prev : moveRowToDay(prev, from, rowIndex, to)
    })

  const chooseExercise = (exercise: DraftExercise) => {
    if (picker) updateRow(picker.dayKey, picker.rowKey, r => ({ ...r, exercise }))
    setPicker(null)
  }

  // ── Paso 3: guardar una rutina por día (reintenta solo las que faltan)
  const runSave = async () => {
    if (saving) return
    setSaving(true)
    setStep('save')
    const statuses: Record<string, DayStatus> = { ...save.statuses }
    const errors: Record<string, string> = {}
    for (const d of days) if (statuses[d.key] !== 'done') statuses[d.key] = 'pending'
    setSave({ statuses: { ...statuses }, errors: {} })

    for (const day of days) {
      if (statuses[day.key] === 'done') continue
      statuses[day.key] = 'saving'
      setSave({ statuses: { ...statuses }, errors: { ...errors } })
      try {
        await routineService.create(dayToPayload(day))
        statuses[day.key] = 'done'
      } catch (err) {
        statuses[day.key] = 'error'
        errors[day.key] = apiErrorMessage(err, t('routineImport.saveDayError'))
      }
      setSave({ statuses: { ...statuses }, errors: { ...errors } })
    }
    setSaving(false)
    if (days.every(d => statuses[d.key] === 'done')) navigate('/routines')
  }

  const doneCount = days.filter(d => save.statuses[d.key] === 'done').length
  const failed = days.some(d => save.statuses[d.key] === 'error')

  return (
    <div className="mx-auto max-w-3xl pb-24 md:pb-8">
      <PageHeader
        title={t('routineImport.title')}
        subtitle={t('routineImport.subtitle')}
        actions={
          <Link to="/routines" className="btn-ghost-dark">
            <i aria-hidden="true" className="bi bi-arrow-left mr-1.5" />{t('nav.routines')}
          </Link>
        }
      />

      <ol className="mb-6 flex items-center gap-2 text-xs font-semibold" aria-label={t('routineImport.stepsLabel')}>
        {STEPS.map((s, i) => {
          const current = s === step
          return (
            <li key={s} aria-current={current ? 'step' : undefined} className="flex flex-1 items-center gap-2">
              <span
                className={
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ' +
                  (current ? 'bg-accent text-neutral-900' : 'border border-white/20 text-neutral-400')
                }
              >
                {i + 1}
              </span>
              <span className={current ? 'text-[color:var(--text)]' : 'text-[color:var(--text-muted)]'}>{t(`routineImport.steps.${s}`)}</span>
              {i < STEPS.length - 1 && <span aria-hidden="true" className="h-px flex-1 bg-white/10" />}
            </li>
          )
        })}
      </ol>

      {/* ───────── 1. Pegar ───────── */}
      {step === 'paste' && (
        <GlowCard>
          <section className="p-5 sm:p-6">
            <h2 className="text-sm font-bold text-white">{t('routineImport.pasteTitle')}</h2>
            <p className="mt-1 text-sm text-neutral-400">{t('routineImport.pasteHelp')}</p>

            <label htmlFor="import-text" className="form-label mt-4">{t('routineImport.textLabel')}</label>
            <textarea
              id="import-text"
              value={text}
              onChange={e => { setText(e.target.value); setPasteError(null) }}
              rows={14}
              spellCheck={false}
              placeholder={t('routineImport.textPlaceholder')}
              aria-describedby={pasteError ? 'import-error' : undefined}
              aria-invalid={pasteError ? true : undefined}
              className="form-input form-input-dark min-h-[16rem] resize-y font-mono text-xs leading-relaxed"
            />
            {pasteError && (
              <p id="import-error" role="alert" className="mt-2 text-xs font-semibold text-red-400">{pasteError}</p>
            )}

            {catalogError ? (
              <ErrorState bare className="mt-4" message={t('routines.catalogError')} onRetry={reload} />
            ) : (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={analyze}
                  disabled={!text.trim() || catalogLoading}
                  className="btn-primary disabled:opacity-50"
                >
                  {catalogLoading ? t('routineImport.loadingCatalog') : t('routineImport.analyze')}
                </button>
                <button
                  type="button"
                  onClick={() => { setText(IMPORT_SAMPLE); setPasteError(null) }}
                  className="btn-ghost-dark"
                >
                  {t('routineImport.useExample')}
                </button>
                {text && (
                  <button type="button" onClick={() => setText('')} className="text-xs font-semibold text-neutral-400 hover:text-white">
                    {t('routineImport.clear')}
                  </button>
                )}
              </div>
            )}

            <details className="mt-5 text-sm text-neutral-400">
              <summary className="cursor-pointer font-semibold text-neutral-300">{t('routineImport.formatsTitle')}</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>{t('routineImport.formatTable')}</li>
                <li>{t('routineImport.formatCsv')}</li>
                <li>{t('routineImport.formatFree')}</li>
              </ul>
            </details>
          </section>
        </GlowCard>
      )}

      {/* ───────── 2. Revisar ───────── */}
      {step === 'review' && (
        <div className="space-y-6">
          <GlowCard>
            <div
              role="status"
              className={'px-4 py-3 text-sm font-semibold ' + (summary.pending === 0 ? 'text-green-300' : 'text-amber-300')}
            >
              <i aria-hidden="true" className={`bi ${summary.pending === 0 ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} mr-2`} />
              {t('routineImport.summary', { matched: summary.matched, pending: summary.pending })}
            </div>
          </GlowCard>

          {days.length === 0 && (
            <p className="text-sm text-[color:var(--text-muted)]">{t('routineImport.noDays')}</p>
          )}

          {days.map(day => (
            <section key={day.key} aria-labelledby={`day-title-${day.key}`} className="space-y-3">
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <label id={`day-title-${day.key}`} htmlFor={`day-name-${day.key}`} className="form-label">
                    {t('routineImport.dayName')}
                  </label>
                  <input
                    id={`day-name-${day.key}`}
                    value={day.name}
                    onChange={e => updateDay(day.key, d => ({ ...d, name: e.target.value }))}
                    maxLength={150}
                    className="form-input font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeDay(day.key)}
                  aria-label={t('routineImport.deleteDay', { name: day.name })}
                  className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-neutral-900 text-red-400 transition-colors hover:bg-neutral-800 hover:text-red-300"
                >
                  <i aria-hidden="true" className="bi bi-trash3" />
                </button>
              </div>

              {day.rows.length === 0 && (
                <p className="text-sm text-[color:var(--text-muted)]">{t('routineImport.emptyDay')}</p>
              )}

              {day.rows.map((row, i) => (
                <ImportRowCard
                  key={row.key}
                  row={row}
                  index={i}
                  count={day.rows.length}
                  days={days}
                  dayKey={day.key}
                  onPlanChange={plan => updateRow(day.key, row.key, r => ({ ...r, plan }))}
                  onNotesChange={notes => updateRow(day.key, row.key, r => ({ ...r, notes }))}
                  onPickExercise={() => setPicker({ dayKey: day.key, rowKey: row.key })}
                  onSwap={() => updateRow(day.key, row.key, swapRow)}
                  onDismissWarning={w => updateRow(day.key, row.key, r => dismissWarning(r, w))}
                  onMove={delta => updateDay(day.key, d => moveRow(d, i, i + delta))}
                  onMoveToDay={to => moveToDay(day.key, row.key, to)}
                  onRemove={() => removeRow(day.key, row.key)}
                />
              ))}
            </section>
          ))}

          <GlowCard className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 md:bottom-4">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="min-w-0 text-xs font-medium text-neutral-400" aria-live="polite">
                {canSave(days) ? t('routineImport.readyToSave', { count: days.length }) : t('routineImport.cannotSave')}
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep('paste')} className="btn-ghost-dark">
                  {t('routineImport.back')}
                </button>
                <button type="button" onClick={runSave} disabled={!canSave(days)} className="btn-primary disabled:opacity-50">
                  {t('routineImport.saveRoutines', { count: days.length })}
                </button>
              </div>
            </div>
          </GlowCard>
        </div>
      )}

      {/* ───────── 3. Guardar ───────── */}
      {step === 'save' && (
        <GlowCard>
          <section className="p-5 sm:p-6" aria-live="polite">
            <h2 className="text-sm font-bold text-white">
              {saving
                ? t('routineImport.savingProgress', { done: doneCount, total: days.length })
                : failed ? t('routineImport.savePartial') : t('routineImport.saveDone')}
            </h2>
            <div
              role="progressbar" aria-valuemin={0} aria-valuemax={days.length} aria-valuenow={doneCount}
              aria-label={t('routineImport.progressLabel')}
              className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
            >
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${days.length ? (doneCount / days.length) * 100 : 0}%` }}
              />
            </div>

            <ul className="mt-4 space-y-2">
              {days.map(d => {
                const status = save.statuses[d.key] ?? 'pending'
                return (
                  <li key={d.key} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                      {status === 'saving' ? <Spinner /> : (
                        <i
                          aria-hidden="true"
                          className={'bi ' + (status === 'done' ? 'bi-check-circle-fill text-green-400'
                            : status === 'error' ? 'bi-x-circle-fill text-red-400' : 'bi-circle text-neutral-400')}
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-white">{d.name}</span>
                      <span className="block text-xs text-neutral-400">
                        {t(`routineImport.status.${status}`, { count: d.rows.length })}
                      </span>
                      {status === 'error' && (
                        <span role="alert" className="mt-1 block text-xs font-semibold text-red-400">{save.errors[d.key]}</span>
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>

            {!saving && failed && (
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={runSave} className="btn-primary">{t('common.retry')}</button>
                <button type="button" onClick={() => setStep('review')} className="btn-ghost-dark">
                  {t('routineImport.backToReview')}
                </button>
              </div>
            )}
          </section>
        </GlowCard>
      )}

      <ExercisePickerModal
        open={picker !== null}
        onClose={() => setPicker(null)}
        title={t('routineImport.pickTitle')}
        catalog={draftCatalog}
        loading={catalogLoading}
        error={Boolean(catalogError)}
        onRetry={reload}
        suggestions={pickerRow?.suggestions}
        onSelect={chooseExercise}
        footer={pickerRow && (
          <CreateOwnExercise
            key={pickerRow.key}
            initialName={toTitle(pickerRow.rawName)}
            onCreated={created => {
              addToCatalog(created)
              chooseExercise(created)
            }}
          />
        )}
      />
    </div>
  )
}
