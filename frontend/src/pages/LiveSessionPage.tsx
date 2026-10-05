import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { sessionService } from '../services/sessionService'
import { RoutineExercise } from '../types/routine'
import type { AddSetPayload, LastPerformance } from '../types/session'
import { useWorkoutSession } from '../hooks/useWorkoutSession'
import { useRestTimer, useStopwatch } from '../hooks/useRestTimer'
import { fmtTime } from '../utils/time'
import GlowCard from '../components/ui/GlowCard'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
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

  if (status === 'loading') return (
    <div className="flex justify-center items-center h-screen">
      <Spinner />
    </div>
  )

  if (status === 'error') return (
    <ErrorState message={t('session.loadError')} onRetry={retry} className="h-screen justify-center" />
  )

  if (!currentEx) return (
    <div className="text-center py-20 text-neutral-500 font-medium">{t('session.noExercises')}</div>
  )

  return (
    <div className="max-w-4xl mx-auto px-6 py-6">

      {/* ── PR Toast ── */}
      {newPRs.length > 0 && (
        <div role="status" className="fixed top-4 right-4 bg-accent text-neutral-900 px-5 py-3 shadow-modal font-bold z-50 animate-bounce rounded-2xl">
          <i className="bi bi-trophy-fill mr-2" />{t('session.newPR')} {newPRs[0]}!
        </div>
      )}

      {/* ── Adaptive Rest Toast ── */}
      {adaptiveRestMsg && (
        <div role="status" className="fixed top-4 left-4 bg-blue-600 text-white px-5 py-3 shadow-modal font-bold z-50 rounded-2xl">
          <i className="bi bi-clock-history mr-2" />{adaptiveRestMsg}
        </div>
      )}

      {/* Anuncios para lectores de pantalla (cambios de serie y descansos) */}
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>

      {actionError && (
        <p role="alert" className="mb-4 text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-2xl">{actionError}</p>
      )}

      {/* ── Header ── */}
      <GlowCard className="mb-5">
        <div className="p-5">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-black text-white truncate">{routineName}</h1>
            <div className="flex items-center gap-3">
              <span role="timer" aria-live="off" className="font-mono text-2xl font-black text-accent">{fmtTime(globalSecs)}</span>
              <button onClick={handleAbandon} className="btn-danger py-1.5">
                {t('session.abandon')}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
              <span>{doneSets} {t('session.completedSets')}</span>
              <span>{totalSets} {t('session.totalSets')}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-500 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </GlowCard>

      <div className="flex gap-5 flex-col lg:flex-row">

        {/* ── Main panel ── */}
        <div className="flex-1 space-y-4">

          {failedSet && (
            <div role="alert" className="flex items-center justify-between gap-3 text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-2xl">
              <p className="text-xs font-semibold">{t('session.saveSetError')}</p>
              <button
                onClick={() => persistSet(failedSet)}
                disabled={savingSet}
                className="btn-primary py-1.5 px-4 shrink-0 disabled:opacity-50"
              >
                {t('common.retry')}
              </button>
            </div>
          )}

          {/* Exercise header */}
          <GlowCard>
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="text-2xl font-black text-white">{currentEx.exercise_name}</h2>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider bg-accent text-neutral-900 rounded-full">
                      {currentEx.category}
                    </span>
                    <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">{currentEx.muscle_group}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-accent">
                    {setIdx} <span className="text-lg font-normal text-neutral-500">/ {currentEx.sets}</span>
                  </p>
                  <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">{t('session.set')}</p>
                </div>
              </div>

              {currentEx.notes && (
                <div className="bg-accent/10 border border-accent/30 px-3 py-2 mb-3 rounded-xl">
                  <p className="text-sm text-accent font-medium">{currentEx.notes}</p>
                </div>
              )}

              {currentEx.exercise_notes && (
                <p className="text-xs text-neutral-500 italic mb-1">{currentEx.exercise_notes}</p>
              )}
            </div>
          </GlowCard>

          {/* ── Rest timer ── */}
          {phase === 'resting' && (
            <GlowCard>
              <div className="p-6 text-center">
                <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-3">
                  <i className="bi bi-pause-circle mr-1" />{t('session.rest')}
                </p>
                <p role="timer" aria-live="off" className="text-6xl font-bold text-white mb-4">{fmtTime(rest.remaining)}</p>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-5">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${Math.min(100, (rest.remaining / (currentEx.rest_seconds || 60)) * 100)}%` }}
                  />
                </div>
                <button onClick={skipRest} className="btn-primary">
                  <i className="bi bi-skip-forward-fill mr-1" />{t('session.skipRest')}
                </button>
              </div>
            </GlowCard>
          )}

          {/* ── Exercise countdown (timed) ── */}
          {phase === 'timing' && (
            <GlowCard>
              <div className="p-6 text-center">
                <p className="text-[11px] font-bold text-accent uppercase tracking-widest mb-3">
                  <i className="bi bi-stopwatch mr-1" />{t('session.exerciseTime')}
                </p>
                <p role="timer" aria-live="off" className="text-6xl font-bold text-white mb-4">{fmtTime(exTimer.remaining)}</p>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-5">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${(exTimer.remaining / (currentEx.duration_seconds || 30)) * 100}%` }}
                  />
                </div>
                <button
                  onClick={() => handleCompleteSet(currentEx.duration_seconds! - exTimer.remaining)}
                  disabled={savingSet}
                  className="btn-primary disabled:opacity-50"
                >
                  {t('session.finishEarly')}
                </button>
              </div>
            </GlowCard>
          )}

          {/* ── Inicio de la cuenta atrás (ejercicio por tiempo) ── */}
          {phase === 'working' && isTimed && (
            <GlowCard>
              <div className="p-6 text-center">
                <p className="text-[11px] font-bold text-accent uppercase tracking-widest mb-3">
                  <i className="bi bi-stopwatch mr-1" />{t('session.exerciseTime')}
                </p>
                <p className="text-6xl font-bold text-white mb-5">{fmtTime(currentEx.duration_seconds ?? 0)}</p>
                <button onClick={startExerciseTimer} className="btn-primary">
                  {t('session.startTimer')}
                </button>
              </div>
            </GlowCard>
          )}

          {/* ── Set inputs (reps mode) ── */}
          {phase === 'working' && !isTimed && (
            <GlowCard>
              <div className="p-5 space-y-4">

              {/* Plateau warning */}
              {lastPerf?.plateau_detected && setIdx === 1 && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-800 px-4 py-2.5 font-bold text-sm">
                  <i className="bi bi-exclamation-triangle-fill" />
                  <div>
                    <p>{t('session.plateauWarning')}</p>
                    <p className="font-normal text-xs mt-0.5">{t('session.deloadSuggestion')}</p>
                  </div>
                </div>
              )}

              {/* Overload suggestion badge */}
              {lastPerf && lastPerf.rpe !== null && lastPerf.rpe <= 7 && !lastPerf.plateau_detected && setIdx === 1 && (
                <div className="relative">
                  <button
                    onClick={() => setShowOverloadPopover(p => !p)}
                    className="w-full flex items-center justify-center gap-2 bg-green-50 border border-green-300 text-green-800 px-4 py-2.5 font-bold text-sm hover:bg-green-100 transition-colors"
                  >
                    <i className="bi bi-graph-up-arrow" />
                    {t('session.weightUpSuggestion')} {lastPerf.rpe})
                  </button>
                  {showOverloadPopover && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 shadow-modal p-4 z-40">
                      <p className="text-sm text-neutral-600 mb-3">
                        {t('session.previousRPE')} {lastPerf.rpe}/10. {t('session.addWeight')}
                      </p>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label htmlFor="live-1" className="form-label">{t('session.increment')}</label>
                          <input id="live-1"
                            type="number" min={0} step={0.5}
                            value={overloadIncrement}
                            onChange={e => setOverloadIncrement(e.target.value)}
                            className="form-input text-center font-bold"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const current = parseFloat(setInput.weight_kg) || 0
                            const inc = parseFloat(overloadIncrement) || 2.5
                            setSetInput(p => ({ ...p, weight_kg: (current + inc).toString() }))
                            setShowOverloadPopover(false)
                          }}
                          className="btn-primary px-4 py-2"
                        >
                          {t('session.apply')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="live-2" className="form-label">
                    {t('session.repsGoal')} {currentEx.reps ?? '—'})
                  </label>
                  <input id="live-2"
                    type="number" min={0}
                    value={setInput.reps}
                    onChange={e => setSetInput(p => ({ ...p, reps: Number(e.target.value) }))}
                    className="form-input text-xl font-black text-center"
                  />
                </div>
                <div>
                  <label htmlFor="live-3" className="form-label">
                    {t('session.weightSuggested')} {currentEx.weight_suggestion ? `${currentEx.weight_suggestion})` : ')'}
                  </label>
                  <input id="live-3"
                    type="number" min={0} step={0.5}
                    value={setInput.weight_kg}
                    onChange={e => setSetInput(p => ({ ...p, weight_kg: e.target.value }))}
                    placeholder="—"
                    className="form-input text-xl font-black text-center"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="live-4" className="form-label">
                  {t('session.rpeLabel')} <strong className="text-accent">{setInput.rpe}</strong>/10
                </label>
                <input id="live-4"
                  type="range" min={1} max={10}
                  value={setInput.rpe}
                  onChange={e => setSetInput(p => ({ ...p, rpe: Number(e.target.value) }))}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-wider mt-0.5">
                  <span>{t('session.easy')}</span><span>{t('session.moderate')}</span><span>{t('session.maximum')}</span>
                </div>
              </div>

              <div>
                <label htmlFor="live-5" className="form-label">{t('session.setNote')}</label>
                <input id="live-5"
                  type="text"
                  value={setInput.notes}
                  onChange={e => setSetInput(p => ({ ...p, notes: e.target.value }))}
                  placeholder={t('session.shoulderPainPlaceholder')}
                  className="form-input"
                />
              </div>

                <button
                  onClick={() => handleCompleteSet()}
                  disabled={savingSet}
                  className="w-full btn-primary py-3.5 font-bold text-sm uppercase tracking-wider disabled:opacity-50"
                >
                  <i className="bi bi-check-lg mr-2" />{t('session.setCompleted')}
                </button>
              </div>
            </GlowCard>
          )}

          {/* ── Action buttons ── */}
          {phase !== 'resting' && (
            <GlowCard>
              <div className="p-3 flex gap-3">
                <button
                  onClick={skipExercise}
                  disabled={savingSet || !!failedSet}
                  className="flex-1 disabled:opacity-40 border border-white/15 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white font-semibold text-xs uppercase tracking-wider px-6 py-2.5 rounded-full transition-all"
                >
                  <i className="bi bi-skip-forward-fill mr-1" />{t('session.skipExercise')}
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="flex-1 border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-semibold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full transition-all"
                >
                  <i className="bi bi-flag-fill mr-1" />{t('session.finishSession')}
                </button>
              </div>
            </GlowCard>
          )}
        </div>

        {/* ── Sidebar: exercise list ── */}
        <GlowCard className="lg:w-64 h-fit">
          <div className="p-4">
            <p className="text-[11px] font-black text-white uppercase tracking-wider mb-3">{t('nav.exercises')}</p>
            <ul className="space-y-1.5">
              {exercises.map((ex, i) => {
                const done  = setsCompletedForEx(ex.exercise_id)
                const total = ex.sets
                const isCurrentEx = i === exIdx
                return (
                  <li key={ex.re_id}>
                    <button
                      onClick={() => !isCurrentEx && jumpTo(i)}
                      disabled={savingSet || !!failedSet}
                      aria-current={isCurrentEx ? 'true' : undefined}
                      className={`w-full disabled:opacity-60 text-left px-3 py-2 text-sm transition-colors rounded-xl ${
                        isCurrentEx
                          ? 'bg-accent/10 border border-accent/40 font-bold text-accent'
                          : done >= total
                          ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                          : 'hover:bg-white/5 text-neutral-300 border border-transparent'
                      }`}
                    >
                      <span className="mr-2">
                        {done >= total ? <i className="bi bi-check-circle-fill text-green-400" /> : isCurrentEx ? <i className="bi bi-circle-fill text-accent" /> : <i className="bi bi-circle text-neutral-600" />}
                      </span>
                      {ex.exercise_name}
                      <span className="block text-[11px] font-semibold text-neutral-500 mt-0.5 ml-5">
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

      {/* ── Finish modal ── */}
      <Modal open={showModal} onClose={() => setShowModal(false)} labelledBy="finish-session-title">
            <GlowCard>
              <div className="p-6">
                <h2 id="finish-session-title" className="text-xl font-bold text-white mb-1">{t('session.finishSession')}</h2>
                <p className="text-sm text-neutral-400 mb-5">
                  {doneSets} {t('session.completedSets')} · {fmtTime(globalSecs)}
                </p>

                {/* Star rating */}
                <div className="mb-5">
                  <p className="form-label">{t('session.workoutRating')}</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        aria-label={`${star}`}
                        aria-pressed={star <= finishRating}
                        onClick={() => setFinishRating(star)}
                        className={`text-2xl transition-transform hover:scale-110 ${
                          star <= finishRating ? 'text-accent' : 'text-neutral-700'
                        }`}
                      >
                        <i className={`bi bi-star-fill`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <label htmlFor="live-6" className="form-label">{t('session.workoutNotes')}</label>
                  <textarea id="live-6"
                    rows={3}
                    value={finishNotes}
                    onChange={e => setFinishNotes(e.target.value)}
                    placeholder={t('session.goodWorkoutPlaceholder')}
                    className="form-input resize-none"
                  />
                </div>

                {finishError && (
                  <p role="alert" className="mb-4 text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-2xl">{finishError}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 border border-white/15 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white font-semibold text-xs uppercase tracking-wider px-6 py-2.5 rounded-full transition-all"
                  >
                    {t('session.continue')}
                  </button>
                  <button
                    onClick={handleFinish}
                    disabled={saving}
                    className="flex-1 btn-primary disabled:opacity-50"
                  >
                    {saving ? t('common.saving') : t('session.saveAndFinish')}
                  </button>
                </div>
              </div>
            </GlowCard>
      </Modal>
    </div>
  )
}
