import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { sessionService } from '../services/sessionService'
import { RoutineExercise } from '../types/routine'
import type { AddSetPayload, LastPerformance } from '../types/session'
import { useWorkoutSession } from '../hooks/useWorkoutSession'
import { useRestTimer, useStopwatch } from '../hooks/useRestTimer'
import { fmtTime } from '../utils/time'
import { label } from '../utils/labels'
import GlowCard from '../components/ui/GlowCard'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import ToastStack, { type ToastItem } from '../components/ui/ToastStack'
import ErrorState from '../components/ui/ErrorState'

type Phase = 'working' | 'resting' | 'timing'

interface SetInput {
  reps: number
  weight_kg: string
  rpe: number
  notes: string
}

interface CompletedSet {
  exercise_id: number
  set_number: number
  new_pr: boolean
}

// Serie pendiente de guardar: se conserva tal cual si falla para poder reintentarla
interface PendingSet {
  payload: AddSetPayload
  exercise: RoutineExercise
  exIdx: number
  setNumber: number
  rpe: number
}

const DEFAULT_INPUT: SetInput = { reps: 10, weight_kg: '', rpe: 7, notes: '' }

// Remonta la sesión entera al cambiar de rutina (estado limpio, nueva sesión)
export default function LiveSessionPage() {
  const { routineId } = useParams<{ routineId: string }>()
  return <LiveSession key={routineId} routineId={Number(routineId)} />
}

function LiveSession({ routineId }: { routineId: number }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const session = useWorkoutSession(routineId)
  const { status, exercises, routineName, retry } = session

  // Navigation
  const [exIdx, setExIdx]   = useState(0)
  const [setIdx, setSetIdx] = useState(1)
  const [phase, setPhase]   = useState<Phase>('working')

  // Set inputs
  const [setInput, setSetInput] = useState<SetInput>(DEFAULT_INPUT)

  // Completed sets tracking
  const [completedSets, setCompletedSets] = useState<CompletedSet[]>([])
  const [newPRs, setNewPRs]               = useState<string[]>([])
  const [savingSet, setSavingSet]         = useState(false)
  const [failedSet, setFailedSet]         = useState<PendingSet | null>(null)
  const savingSetRef = useRef(false)

  // Mensajes
  const [adaptiveRestMsg, setAdaptiveRestMsg] = useState('')
  const [announcement, setAnnouncement]       = useState('')
  const [actionError, setActionError]         = useState<string | null>(null)

  // Overload suggestion
  const [showOverloadPopover, setShowOverloadPopover] = useState(false)
  const [overloadIncrement, setOverloadIncrement] = useState('2.5')

  // Finish modal
  const [showModal, setShowModal]       = useState(false)
  const [finishNotes, setFinishNotes]   = useState('')
  const [finishRating, setFinishRating] = useState(4)
  const [saving, setSaving]             = useState(false)
  const [finishError, setFinishError]   = useState<string | null>(null)

  // Smart Fill: last performance data + plateau
  const [lastPerf, setLastPerf] = useState<LastPerformance | null>(null)

  const currentEx = exercises[exIdx] as RoutineExercise | undefined
  const isTimed   = currentEx ? currentEx.duration_seconds !== null : false

  // ── Temporizadores: el fin es un timestamp y los callbacks se leen siempre actuales
  const handlers = useRef({ onRestEnd: () => {}, onTimeUp: () => {} })
  const rest      = useRestTimer(() => handlers.current.onRestEnd())
  const exTimer   = useRestTimer(() => handlers.current.onTimeUp())
  const globalSecs = useStopwatch(session.inProgress)

  // Timeouts de avisos: se limpian al desmontar
  const timeouts = useRef(new Set<ReturnType<typeof setTimeout>>())
  const adaptiveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const pending = timeouts.current
    return () => {
      pending.forEach(clearTimeout)
      pending.clear()
      if (adaptiveTimeout.current) clearTimeout(adaptiveTimeout.current)
    }
  }, [])
  const later = (fn: () => void, ms: number) => {
    const id = setTimeout(() => { timeouts.current.delete(id); fn() }, ms)
    timeouts.current.add(id)
  }

  // ── Smart Fill: al cambiar de ejercicio, última marca y valores iniciales (con cancelación)
  useEffect(() => {
    if (!currentEx) return
    let cancelled = false
    const fallback: SetInput = {
      reps: currentEx.reps ?? 10,
      weight_kg: currentEx.weight_suggestion?.toString() ?? '',
      rpe: 7,
      notes: '',
    }
    sessionService.getLastPerformance(currentEx.exercise_id)
      .then(perf => {
        if (cancelled) return
        setLastPerf(perf)
        setSetInput(perf
          ? { ...fallback, reps: perf.reps_done ?? fallback.reps, weight_kg: perf.weight_kg?.toString() ?? fallback.weight_kg }
          : fallback)
      })
      .catch(() => {
        if (cancelled) return
        setLastPerf(null)
        setSetInput(fallback)
      })
    return () => { cancelled = true }
  }, [currentEx])

  // ── Move to next set or exercise
  const goNext = () => {
    if (!currentEx) return
    const isLastSet = setIdx >= currentEx.sets
    const isLastEx  = exIdx >= exercises.length - 1

    if (isLastSet && isLastEx) {
      setShowModal(true)
      return
    }

    if (isLastSet) {
      setExIdx(exIdx + 1)
      setSetIdx(1)
      setAnnouncement(exercises[exIdx + 1].exercise_name)
    } else {
      setSetIdx(setIdx + 1)
      setAnnouncement(t('session.announceSet', { set: setIdx + 1, total: currentEx.sets }))
    }
    setPhase('working')
  }

  const startRest = (restDuration: number) => {
    rest.start(restDuration)
    setPhase('resting')
    setAnnouncement(t('session.announceRest', { seconds: restDuration }))
  }

  // ── Guardar una serie; si falla se conserva para reintentar
  const persistSet = async (snap: PendingSet) => {
    if (savingSetRef.current) return
    savingSetRef.current = true
    setSavingSet(true)
    setActionError(null)
    try {
      const result = await session.saveSet(snap.payload)
      setFailedSet(null)
      setCompletedSets(prev => [
        ...prev,
        { exercise_id: snap.exercise.exercise_id, set_number: snap.setNumber, new_pr: result.new_pr },
      ])

      if (result.new_pr) {
        setNewPRs(prev => [...prev, snap.exercise.exercise_name])
        later(() => setNewPRs(prev => prev.slice(1)), 3000)
      }

      const isLastSet = snap.setNumber >= snap.exercise.sets
      const isLastEx  = snap.exIdx >= exercises.length - 1

      if (isLastSet && isLastEx) {
        setShowModal(true)
      } else {
        // Adaptive rest: +30s if RPE 10
        const baseRest = snap.exercise.rest_seconds || 60
        if (adaptiveTimeout.current) clearTimeout(adaptiveTimeout.current)
        if (snap.rpe >= 10) {
          setAdaptiveRestMsg(t('session.rpe10Detected'))
          adaptiveTimeout.current = setTimeout(() => setAdaptiveRestMsg(''), 4000)
          startRest(baseRest + 30)
        } else {
          setAdaptiveRestMsg('')
          startRest(baseRest)
        }
      }
    } catch {
      setFailedSet(snap)
    } finally {
      savingSetRef.current = false
      setSavingSet(false)
    }
  }

  // ── Complete a set
  const handleCompleteSet = (durationDone?: number) => {
    if (!currentEx) return
    exTimer.stop()
    return persistSet({
      exercise: currentEx,
      exIdx,
      setNumber: setIdx,
      rpe: setInput.rpe,
      payload: {
        exercise_id:       currentEx.exercise_id,
        set_number:        setIdx,
        reps_done:         isTimed ? null : Number(setInput.reps),
        weight_kg:         setInput.weight_kg ? Number(setInput.weight_kg) : null,
        duration_done_sec: durationDone ?? null,
        rpe:               setInput.rpe || null,
        notes:             setInput.notes || null,
      },
    })
  }

  // ── Start exercise countdown timer (timed exercises)
  const startExerciseTimer = () => {
    if (!currentEx?.duration_seconds) return
    exTimer.start(currentEx.duration_seconds)
    setPhase('timing')
  }

  // Los temporizadores llaman siempre a la última versión de estos callbacks
  useEffect(() => {
    handlers.current = {
      onRestEnd: () => {
        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
        goNext()
      },
      onTimeUp: () => {
        if (currentEx?.duration_seconds) handleCompleteSet(currentEx.duration_seconds)
      },
    }
  })

  // ── Skip rest
  const skipRest = () => {
    rest.stop()
    goNext()
  }

  // ── Skip exercise
  const skipExercise = () => {
    rest.stop()
    exTimer.stop()
    const isLastEx = exIdx >= exercises.length - 1
    if (isLastEx) { setShowModal(true); return }
    setExIdx(exIdx + 1)
    setSetIdx(1)
    setPhase('working')
  }

  // ── Jump to exercise
  const jumpTo = (idx: number) => {
    rest.stop()
    exTimer.stop()
    setExIdx(idx)
    setSetIdx(1)
    setPhase('working')
  }

  // ── Finish session
  const handleFinish = async () => {
    setSaving(true)
    setFinishError(null)
    try {
      await session.finish({
        status:           'completed',
        notes:            finishNotes || null,
        rating:           finishRating,
        duration_seconds: globalSecs,
      })
      rest.stop()
      exTimer.stop()
      navigate(`/session/${session.sessionId}/summary`)
    } catch {
      setFinishError(t('session.finishError'))
    } finally {
      setSaving(false)
    }
  }

  // ── Abandon session
  const handleAbandon = async () => {
    if (!confirm(t('session.abandonConfirm'))) return
    if (session.sessionId === null) { navigate('/routines'); return }
    setActionError(null)
    try {
      await session.finish({ status: 'abandoned', duration_seconds: globalSecs })
      navigate('/routines')
    } catch {
      setActionError(t('session.abandonError'))
    }
  }

  // ── Computed progress
  const totalSets     = exercises.reduce((s, e) => s + e.sets, 0)
  const doneSets      = completedSets.length
  const progressPct   = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0

  const setsCompletedForEx = (exerciseId: number) =>
    completedSets.filter(s => s.exercise_id === exerciseId).length

  const adjustReps = (delta: number) =>
    setSetInput(p => ({ ...p, reps: Math.max(0, (Number(p.reps) || 0) + delta) }))

  const adjustWeight = (delta: number) =>
    setSetInput(p => {
      const next = Math.max(0, (parseFloat(p.weight_kg) || 0) + delta)
      return { ...p, weight_kg: String(Math.round(next * 100) / 100) }
    })

  if (status === 'loading') return (
    <div role="status" aria-busy="true" className="space-y-4">
      <span className="sr-only">{t('common.loading')}</span>
      <Skeleton tone="dark" className="h-24 rounded-apple" />
      <Skeleton tone="dark" className="h-32 rounded-apple" />
      <Skeleton tone="dark" className="h-64 rounded-apple" />
    </div>
  )

  if (status === 'error') return (
    <ErrorState message={t('session.loadError')} onRetry={retry} />
  )

  if (!currentEx) return (
    <EmptyState
      icon="bi-clipboard-x"
      title={t('session.noExercises')}
      action={<Link to="/routines" className="btn-primary">{t('nav.routines')}</Link>}
    />
  )

  const toasts: ToastItem[] = [
    ...(newPRs.length > 0
      ? [{ id: `pr-${newPRs.length}-${newPRs[0]}`, icon: 'bi-trophy-fill', tone: 'accent' as const, text: `${t('session.newPR')} ${newPRs[0]}!` }]
      : []),
    ...(adaptiveRestMsg
      ? [{ id: 'adaptive-rest', icon: 'bi-clock-history', tone: 'neutral' as const, text: adaptiveRestMsg }]
      : []),
  ]

  const restTotal = currentEx.rest_seconds || 60
  const canAct = !savingSet && !failedSet

  // Acción principal de la barra inferior según la fase
  const primary: { label: string; icon: string; onClick: () => void; disabled?: boolean } =
    phase === 'resting'
      ? { label: t('session.skipRest'), icon: 'bi-skip-forward-fill', onClick: skipRest }
      : phase === 'timing'
      ? {
          label: t('session.finishEarly'),
          icon: 'bi-stop-fill',
          onClick: () => handleCompleteSet(currentEx.duration_seconds! - exTimer.remaining),
          disabled: savingSet,
        }
      : isTimed
      ? { label: t('session.startTimer'), icon: 'bi-play-fill', onClick: startExerciseTimer }
      : { label: t('session.setCompleted'), icon: 'bi-check-lg', onClick: () => handleCompleteSet(), disabled: savingSet }

  return (
    <div className="pb-12">
      <ToastStack toasts={toasts} />

      {/* Anuncios para lectores de pantalla (cambios de serie y descansos) */}
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>

      {actionError && (
        <p role="alert" className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-400">{actionError}</p>
      )}

      {/* ── Cabecera: nombre, cronómetro y menú ── */}
      <GlowCard className="mb-4 overflow-visible">
        <div className="p-4">
          <div className="flex items-center justify-between gap-2">
            <h1 className="min-w-0 truncate text-lg font-bold text-white">{routineName}</h1>
            <div className="flex shrink-0 items-center gap-1">
              <span role="timer" aria-live="off" className="text-2xl font-black tabular-nums text-accent">{fmtTime(globalSecs)}</span>
              <OverflowMenu
                label={t('session.menu')}
                items={[
                  { key: 'skip', icon: 'bi-skip-forward-fill', label: t('session.skipExercise'), onSelect: skipExercise, disabled: !canAct },
                  { key: 'finish', icon: 'bi-flag-fill', label: t('session.finishSession'), onSelect: () => setShowModal(true) },
                  { key: 'abandon', icon: 'bi-x-octagon', label: t('session.abandon'), onSelect: handleAbandon, danger: true },
                ]}
              />
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs font-medium tabular-nums text-neutral-400">
              <span>{doneSets} {t('session.completedSets')}</span>
              <span>{totalSets} {t('session.totalSets')}</span>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPct}
              aria-label={t('session.completedSets')}
              className="h-1.5 overflow-hidden rounded-full bg-white/10"
            >
              <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>
      </GlowCard>

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-5">

        {/* ── Main panel ── */}
        <div className="flex-1 space-y-4">

          {failedSet && (
            <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-400">
              <p className="text-sm font-medium">{t('session.saveSetError')}</p>
              <button
                onClick={() => persistSet(failedSet)}
                disabled={savingSet}
                className="btn-primary shrink-0 disabled:opacity-50"
              >
                {t('common.retry')}
              </button>
            </div>
          )}

          {/* Ejercicio actual */}
          <GlowCard>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold leading-tight text-white">{currentEx.exercise_name}</h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-neutral-900">
                      {label('categories', currentEx.category)}
                    </span>
                    <span className="text-xs font-medium text-neutral-400">{label('muscles', currentEx.muscle_group)}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-3xl font-bold tabular-nums text-accent">
                    {setIdx} <span className="text-lg font-normal text-neutral-400">/ {currentEx.sets}</span>
                  </p>
                  <p className="text-xs font-medium text-neutral-400">{t('session.set')}</p>
                </div>
              </div>

              {currentEx.notes && (
                <div className="mt-3 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2">
                  <p className="text-sm font-medium text-accent">{currentEx.notes}</p>
                </div>
              )}

              {currentEx.exercise_notes && (
                <p className="mt-3 text-xs italic text-neutral-400">{currentEx.exercise_notes}</p>
              )}
            </div>
          </GlowCard>

          {/* ── Descanso (la tarjeta con glow de la pantalla) ── */}
          {phase === 'resting' && (
            <GlowCard glow>
              <div className="p-6 text-center">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
                  <i aria-hidden="true" className="bi bi-pause-circle mr-1" />{t('session.rest')}
                </p>
                <p role="timer" aria-live="off" className="mb-4 text-6xl font-bold tabular-nums text-white">{fmtTime(rest.remaining)}</p>
                <div className="h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${Math.min(100, (rest.remaining / restTotal) * 100)}%` }}
                  />
                </div>
              </div>
            </GlowCard>
          )}

          {/* ── Cuenta atrás del ejercicio (por tiempo) ── */}
          {phase === 'timing' && (
            <GlowCard>
              <div className="p-6 text-center">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                  <i aria-hidden="true" className="bi bi-stopwatch mr-1" />{t('session.exerciseTime')}
                </p>
                <p role="timer" aria-live="off" className="mb-4 text-6xl font-bold tabular-nums text-white">{fmtTime(exTimer.remaining)}</p>
                <div className="h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${(exTimer.remaining / (currentEx.duration_seconds || 30)) * 100}%` }}
                  />
                </div>
              </div>
            </GlowCard>
          )}

          {/* ── Inicio de la cuenta atrás (ejercicio por tiempo) ── */}
          {phase === 'working' && isTimed && (
            <GlowCard>
              <div className="p-6 text-center">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                  <i aria-hidden="true" className="bi bi-stopwatch mr-1" />{t('session.exerciseTime')}
                </p>
                <p className="text-6xl font-bold tabular-nums text-white">{fmtTime(currentEx.duration_seconds ?? 0)}</p>
              </div>
            </GlowCard>
          )}

          {/* ── Registro de la serie (por repeticiones) ── */}
          {phase === 'working' && !isTimed && (
            <GlowCard>
              <div className="space-y-5 p-4">

                {/* Plateau */}
                {lastPerf?.plateau_detected && setIdx === 1 && (
                  <div className="flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-300">
                    <i aria-hidden="true" className="bi bi-exclamation-triangle-fill mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">{t('session.plateauWarning')}</p>
                      <p className="mt-0.5 text-xs">{t('session.deloadSuggestion')}</p>
                    </div>
                  </div>
                )}

                {/* Sugerencia de sobrecarga progresiva */}
                {lastPerf && lastPerf.rpe !== null && lastPerf.rpe <= 7 && !lastPerf.plateau_detected && setIdx === 1 && (
                  <div>
                    <button
                      type="button"
                      aria-expanded={showOverloadPopover}
                      onClick={() => setShowOverloadPopover(p => !p)}
                      className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm font-semibold text-green-300 transition-colors hover:bg-green-500/20"
                    >
                      <i aria-hidden="true" className="bi bi-graph-up-arrow" />
                      {t('session.weightUpSuggestion')} {lastPerf.rpe})
                    </button>
                    {showOverloadPopover && (
                      <div className="mt-2 rounded-2xl border border-white/10 bg-surface-2 p-4">
                        <p className="mb-3 text-sm text-neutral-300">
                          {t('session.previousRPE')} {lastPerf.rpe}/10. {t('session.addWeight')}
                        </p>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label htmlFor="live-increment" className="form-label">{t('session.increment')}</label>
                            <input
                              id="live-increment"
                              type="number" min={0} step={0.5} inputMode="decimal"
                              value={overloadIncrement}
                              onChange={e => setOverloadIncrement(e.target.value)}
                              className="form-input form-input-dark text-center font-bold tabular-nums"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const current = parseFloat(setInput.weight_kg) || 0
                              const inc = parseFloat(overloadIncrement) || 2.5
                              setSetInput(p => ({ ...p, weight_kg: (current + inc).toString() }))
                              setShowOverloadPopover(false)
                            }}
                            className="btn-primary"
                          >
                            {t('session.apply')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <Stepper
                    id="live-reps"
                    label={t('session.repsLabel')}
                    hint={currentEx.reps ? t('session.repsTarget', { reps: currentEx.reps }) : undefined}
                    value={String(setInput.reps)}
                    inputMode="numeric"
                    onChange={v => setSetInput(p => ({ ...p, reps: Number(v.replace(/\D/g, '')) || 0 }))}
                    onMinus={() => adjustReps(-1)}
                    onPlus={() => adjustReps(1)}
                    minusLabel={t('session.repsDown')}
                    plusLabel={t('session.repsUp')}
                  />
                  <Stepper
                    id="live-weight"
                    label={t('session.weightLabel')}
                    hint={currentEx.weight_suggestion ? t('session.weightTarget', { kg: currentEx.weight_suggestion }) : undefined}
                    value={setInput.weight_kg}
                    placeholder="—"
                    inputMode="decimal"
                    onChange={v => {
                      const clean = v.replace(',', '.')
                      if (/^\d{0,4}(\.\d{0,2})?$/.test(clean)) setSetInput(p => ({ ...p, weight_kg: clean }))
                    }}
                    onMinus={() => adjustWeight(-2.5)}
                    onPlus={() => adjustWeight(2.5)}
                    minusLabel={t('session.weightDown')}
                    plusLabel={t('session.weightUp')}
                  />
                </div>

                {/* RPE: 10 botones en vez de slider */}
                <fieldset>
                  <legend className="form-label">
                    {t('session.rpeLabel')} <strong className="tabular-nums text-accent">{setInput.rpe}</strong>/10
                  </legend>
                  <div className="flex justify-between gap-0.5">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                      <label key={n} className="min-w-0 flex-1 cursor-pointer sm:flex-none">
                        <input
                          type="radio"
                          name="rpe"
                          value={n}
                          checked={setInput.rpe === n}
                          onChange={() => setSetInput(p => ({ ...p, rpe: n }))}
                          aria-label={t('session.rpeValue', { value: n })}
                          className="peer sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className="flex h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-semibold tabular-nums text-neutral-300 transition-colors peer-checked:border-accent peer-checked:bg-accent peer-checked:font-bold peer-checked:text-neutral-900 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent sm:w-8"
                        >
                          {n}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-neutral-400">
                    <span>{t('session.easy')}</span><span>{t('session.moderate')}</span><span>{t('session.maximum')}</span>
                  </div>
                </fieldset>

                <div>
                  <label htmlFor="live-note" className="form-label">{t('session.setNote')}</label>
                  <input
                    id="live-note"
                    type="text"
                    value={setInput.notes}
                    onChange={e => setSetInput(p => ({ ...p, notes: e.target.value }))}
                    placeholder={t('session.shoulderPainPlaceholder')}
                    className="form-input form-input-dark"
                  />
                </div>
              </div>
            </GlowCard>
          )}
        </div>

        {/* ── Lista de ejercicios ── */}
        <GlowCard className="h-fit lg:w-64">
          <div className="p-4">
            <h2 className="mb-3 text-sm font-bold text-white">{t('nav.exercises')}</h2>
            <ul className="space-y-1.5">
              {exercises.map((ex, i) => {
                const done  = setsCompletedForEx(ex.exercise_id)
                const total = ex.sets
                const isCurrentEx = i === exIdx
                return (
                  <li key={ex.re_id}>
                    <button
                      onClick={() => !isCurrentEx && jumpTo(i)}
                      disabled={!canAct}
                      aria-current={isCurrentEx ? 'true' : undefined}
                      className={`min-h-[44px] w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors disabled:opacity-60 ${
                        isCurrentEx
                          ? 'border-accent/40 bg-accent/10 font-bold text-accent'
                          : done >= total
                          ? 'border-green-500/30 bg-green-500/10 text-green-400'
                          : 'border-transparent text-neutral-300 hover:bg-white/5'
                      }`}
                    >
                      <span className="mr-2">
                        {done >= total
                          ? <i aria-hidden="true" className="bi bi-check-circle-fill text-green-400" />
                          : isCurrentEx
                          ? <i aria-hidden="true" className="bi bi-circle-fill text-accent" />
                          : <i aria-hidden="true" className="bi bi-circle text-neutral-400" />}
                      </span>
                      {ex.exercise_name}
                      <span className="ml-5 mt-0.5 block text-xs font-medium tabular-nums text-neutral-400">
                        {done}/{total} {t('common.sets')}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </GlowCard>
      </div>

      {/* ── Barra de acción fija: botón principal al alcance del pulgar ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-neutral-900/90 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:px-6">
          <button
            onClick={primary.onClick}
            disabled={primary.disabled}
            className="btn-primary h-16 w-full text-base disabled:opacity-50"
          >
            <i aria-hidden="true" className={`bi ${primary.icon} mr-2 text-xl`} />{primary.label}
          </button>
        </div>
      </div>

      {/* ── Modal de fin: bottom-sheet en móvil ── */}
      <Modal open={showModal} onClose={() => setShowModal(false)} labelledBy="finish-session-title" placement="sheet">
        <GlowCard className="rounded-b-none sm:rounded-b-apple">
          <div className="p-6">
            <h2 id="finish-session-title" className="mb-1 text-xl font-bold text-white">{t('session.finishSession')}</h2>
            <p className="mb-5 text-sm tabular-nums text-neutral-400">
              {doneSets} {t('session.completedSets')} · {fmtTime(globalSecs)}
            </p>

            {/* Valoración */}
            <div className="mb-5">
              <p className="form-label">{t('session.workoutRating')}</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    aria-label={`${star}`}
                    aria-pressed={star <= finishRating}
                    onClick={() => setFinishRating(star)}
                    className={`flex h-11 w-11 items-center justify-center text-2xl transition-colors ${
                      star <= finishRating ? 'text-accent' : 'text-neutral-500'
                    }`}
                  >
                    <i aria-hidden="true" className="bi bi-star-fill" />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label htmlFor="live-finish-notes" className="form-label">{t('session.workoutNotes')}</label>
              <textarea
                id="live-finish-notes"
                rows={3}
                value={finishNotes}
                onChange={e => setFinishNotes(e.target.value)}
                placeholder={t('session.goodWorkoutPlaceholder')}
                className="form-input form-input-dark resize-none"
              />
            </div>

            {finishError && (
              <p role="alert" className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-400">{finishError}</p>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="btn-ghost-dark flex-1">
                {t('session.continue')}
              </button>
              <button onClick={handleFinish} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
                {saving ? t('common.saving') : t('session.saveAndFinish')}
              </button>
            </div>
          </div>
        </GlowCard>
      </Modal>
    </div>
  )
}

/* ─── Piezas de presentación de la sesión ─────────────────────── */

interface StepperProps {
  id: string
  label: string
  hint?: string
  value: string
  placeholder?: string
  inputMode: 'numeric' | 'decimal'
  onChange: (value: string) => void
  onMinus: () => void
  onPlus: () => void
  minusLabel: string
  plusLabel: string
}

// Valor grande con botones −/+ de 56px: se maneja con el pulgar sin teclado
function Stepper({
  id, label, hint, value, placeholder, inputMode, onChange, onMinus, onPlus, minusLabel, plusLabel,
}: StepperProps) {
  const stepButton =
    'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-2xl text-white transition-colors hover:bg-white/10 active:bg-white/15'
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="form-label !mb-0">{label}</label>
        {hint && <span className="text-xs tabular-nums text-neutral-400">{hint}</span>}
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onMinus} aria-label={minusLabel} className={stepButton}>
          <i aria-hidden="true" className="bi bi-dash-lg" />
        </button>
        <input
          id={id}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={e => e.target.select()}
          className="form-input form-input-dark !h-14 min-w-0 flex-1 !px-2 text-center text-4xl font-black tabular-nums"
        />
        <button type="button" onClick={onPlus} aria-label={plusLabel} className={stepButton}>
          <i aria-hidden="true" className="bi bi-plus-lg" />
        </button>
      </div>
    </div>
  )
}

interface OverflowItem {
  key: string
  icon: string
  label: string
  onSelect: () => void
  danger?: boolean
  disabled?: boolean
}

// Menú "⋯" de la cabecera: acciones poco frecuentes lejos del pulgar
function OverflowMenu({ label, items }: { label: string; items: OverflowItem[] }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls="session-menu"
        onClick={() => setOpen(v => !v)}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-xl text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
      >
        <i aria-hidden="true" className="bi bi-three-dots" />
      </button>
      {open && (
        <ul
          id="session-menu"
          className="absolute right-0 top-full z-30 mt-2 w-60 rounded-2xl border border-white/10 bg-surface-2 p-1.5 shadow-modal"
        >
          {items.map(item => (
            <li key={item.key}>
              <button
                type="button"
                disabled={item.disabled}
                onClick={() => { setOpen(false); item.onSelect() }}
                className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition-colors disabled:opacity-40 ${
                  item.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-neutral-200 hover:bg-white/5'
                }`}
              >
                <i aria-hidden="true" className={`bi ${item.icon} text-base`} />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
