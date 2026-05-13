import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { routineService } from '../services/routineService'
import { sessionService } from '../services/sessionService'
import { RoutineExercise } from '../types/routine'
import GlowCard from '../components/ui/GlowCard'

// ─── helpers ─────────────────────────────────────────────────
function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

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

export default function LiveSessionPage() {
  const { routineId } = useParams<{ routineId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Session data
  const sessionIdRef              = useRef<number | null>(null)
  const sessionCreated            = useRef(false)
  const [exercises, setExercises] = useState<RoutineExercise[]>([])
  const [routineName, setRoutineName] = useState('')
  const [loading, setLoading]     = useState(true)

  // Navigation
  const [exIdx, setExIdx]   = useState(0)
  const [setIdx, setSetIdx] = useState(1)

  // Timers
  const [globalSecs, setGlobalSecs]   = useState(0)
  const [restSecs, setRestSecs]       = useState(0)
  const [exerciseSecs, setExerciseSecs] = useState(0)
  const [phase, setPhase]             = useState<Phase>('working')

  const globalTimer   = useRef<ReturnType<typeof setInterval> | null>(null)
  const restTimer     = useRef<ReturnType<typeof setInterval> | null>(null)
  const exerciseTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Set inputs
  const [setInput, setSetInput] = useState<SetInput>({ reps: 10, weight_kg: '', rpe: 7, notes: '' })

  // Completed sets tracking
  const [completedSets, setCompletedSets] = useState<CompletedSet[]>([])
  const [newPRs, setNewPRs]               = useState<string[]>([])

  // Adaptive rest message
  const [adaptiveRestMsg, setAdaptiveRestMsg] = useState('')

  // Overload suggestion
  const [showOverloadPopover, setShowOverloadPopover] = useState(false)
  const [overloadIncrement, setOverloadIncrement] = useState('2.5')

  // Finish modal
  const [showModal, setShowModal]       = useState(false)
  const [finishNotes, setFinishNotes]   = useState('')
  const [finishRating, setFinishRating] = useState(4)
  const [saving, setSaving]             = useState(false)

  // Smart Fill: last performance data + plateau
  const [lastPerf, setLastPerf] = useState<{ weight_kg: number | null; reps_done: number | null; rpe: number | null; plateau_detected: boolean } | null>(null)

  const currentEx = exercises[exIdx] as RoutineExercise | undefined
  const isTimed   = currentEx ? currentEx.duration_seconds !== null : false

  // ── Smart Fill: fetch last performance for an exercise
  const fetchSmartFill = useCallback(async (exerciseId: number, fallbackReps: number | null, fallbackWeight: number | null) => {
    try {
      const perf = await sessionService.getLastPerformance(exerciseId)
      setLastPerf(perf)
      if (perf) {
        setSetInput({
          reps: perf.reps_done ?? fallbackReps ?? 10,
          weight_kg: perf.weight_kg?.toString() ?? fallbackWeight?.toString() ?? '',
          rpe: 7,
          notes: '',
        })
      } else {
        setSetInput({
          reps: fallbackReps ?? 10,
          weight_kg: fallbackWeight?.toString() ?? '',
          rpe: 7,
          notes: '',
        })
      }
    } catch {
      setLastPerf(null)
      setSetInput({
        reps: fallbackReps ?? 10,
        weight_kg: fallbackWeight?.toString() ?? '',
        rpe: 7,
        notes: '',
      })
    }
  }, [])

  // ── Global stopwatch
  const startGlobalTimer = useCallback(() => {
    if (globalTimer.current) return
    globalTimer.current = setInterval(() => setGlobalSecs(s => s + 1), 1000)
  }, [])

  // ── Init: fetch routine + create session
  useEffect(() => {
    if (sessionCreated.current) return
    sessionCreated.current = true

    const init = async () => {
      try {
        const routine = await routineService.getById(Number(routineId))
        setRoutineName(routine.name)
        const exs = routine.exercises ?? []
        setExercises(exs)

        const { id } = await sessionService.create(Number(routineId))
        sessionIdRef.current = id

        if (exs.length > 0) {
          await fetchSmartFill(exs[0].exercise_id, exs[0].reps, exs[0].weight_suggestion)
          if (exs[0].duration_seconds) {
            setExerciseSecs(exs[0].duration_seconds)
          }
        }

        startGlobalTimer()
      } finally {
        setLoading(false)
      }
    }
    init()

    return () => {
      if (globalTimer.current)   clearInterval(globalTimer.current)
      if (restTimer.current)     clearInterval(restTimer.current)
      if (exerciseTimer.current) clearInterval(exerciseTimer.current)
    }
  }, [routineId, startGlobalTimer])

  // ── Move to next set or exercise
  const goNext = useCallback(() => {
    if (!currentEx) return
    const isLastSet = setIdx >= currentEx.sets
    const isLastEx  = exIdx >= exercises.length - 1

    if (isLastSet && isLastEx) {
      setShowModal(true)
      return
    }

    if (isLastSet) {
      const nextIdx = exIdx + 1
      const next    = exercises[nextIdx]
      setExIdx(nextIdx)
      setSetIdx(1)
      fetchSmartFill(next.exercise_id, next.reps, next.weight_suggestion)
      if (next.duration_seconds) {
        setExerciseSecs(next.duration_seconds)
        setPhase('timing')
        startExerciseTimer(next.duration_seconds)
      } else {
        setPhase('working')
      }
    } else {
      setSetIdx(s => s + 1)
      setPhase('working')
    }
  }, [currentEx, setIdx, exIdx, exercises])

  // ── Start rest timer
  const startRest = useCallback((restDuration: number) => {
    if (restTimer.current) clearInterval(restTimer.current)
    setRestSecs(restDuration)
    setPhase('resting')
    restTimer.current = setInterval(() => {
      setRestSecs(prev => {
        if (prev <= 1) {
          clearInterval(restTimer.current!)
          restTimer.current = null
          if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
          goNext()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [goNext])

  // ── Start exercise countdown timer (timed exercises)
  const startExerciseTimer = (duration: number) => {
    if (exerciseTimer.current) clearInterval(exerciseTimer.current)
    setExerciseSecs(duration)
    setPhase('timing')
    exerciseTimer.current = setInterval(() => {
      setExerciseSecs(prev => {
        if (prev <= 1) {
          clearInterval(exerciseTimer.current!)
          exerciseTimer.current = null
          handleCompleteSet(duration)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // ── Complete a set
  const handleCompleteSet = useCallback(async (durationDone?: number) => {
    if (!currentEx || !sessionIdRef.current) return

    try {
      const result = await sessionService.addSet(sessionIdRef.current, {
        exercise_id:      currentEx.exercise_id,
        set_number:       setIdx,
        reps_done:        isTimed ? null : Number(setInput.reps),
        weight_kg:        setInput.weight_kg ? Number(setInput.weight_kg) : null,
        duration_done_sec: durationDone ?? null,
        rpe:              setInput.rpe || null,
        notes:            setInput.notes || null,
      })

      setCompletedSets(prev => [
        ...prev,
        { exercise_id: currentEx.exercise_id, set_number: setIdx, new_pr: result.new_pr },
      ])

      if (result.new_pr) {
        setNewPRs(prev => [...prev, currentEx.exercise_name])
        setTimeout(() => setNewPRs(prev => prev.slice(1)), 3000)
      }

      const isLastSet = setIdx >= currentEx.sets
      const isLastEx  = exIdx >= exercises.length - 1

      if (isLastSet && isLastEx) {
        setShowModal(true)
      } else {
        // Adaptive rest: +30s if RPE 10
        const baseRest = currentEx.rest_seconds || 60
        if (setInput.rpe >= 10) {
          setAdaptiveRestMsg(t('session.rpe10Detected'))
          setTimeout(() => setAdaptiveRestMsg(''), 4000)
          startRest(baseRest + 30)
        } else {
          setAdaptiveRestMsg('')
          startRest(baseRest)
        }
      }
    } catch (err) {
      console.error('Error saving set:', err)
    }
  }, [currentEx, setIdx, setInput, isTimed, exIdx, exercises.length, startRest, t])

  // ── Skip rest
  const skipRest = () => {
    if (restTimer.current) { clearInterval(restTimer.current); restTimer.current = null }
    goNext()
  }

  // ── Skip exercise
  const skipExercise = () => {
    if (restTimer.current) { clearInterval(restTimer.current); restTimer.current = null }
    const isLastEx = exIdx >= exercises.length - 1
    if (isLastEx) { setShowModal(true); return }
    const nextIdx = exIdx + 1
    const next    = exercises[nextIdx]
    setExIdx(nextIdx)
    setSetIdx(1)
    setPhase('working')
    fetchSmartFill(next.exercise_id, next.reps, next.weight_suggestion)
  }

  // ── Jump to exercise
  const jumpTo = (idx: number) => {
    if (restTimer.current) { clearInterval(restTimer.current); restTimer.current = null }
    const ex = exercises[idx]
    setExIdx(idx)
    setSetIdx(1)
    setPhase('working')
    fetchSmartFill(ex.exercise_id, ex.reps, ex.weight_suggestion)
  }

  // ── Finish session
  const handleFinish = async () => {
    if (!sessionIdRef.current) return
    setSaving(true)
    try {
      await sessionService.finish(sessionIdRef.current, {
        status:           'completed',
        notes:            finishNotes || null,
        rating:           finishRating,
        duration_seconds: globalSecs,
      })
      if (globalTimer.current) clearInterval(globalTimer.current)
      navigate(`/session/${sessionIdRef.current}/summary`)
    } finally {
      setSaving(false)
    }
  }

  // ── Abandon session
  const handleAbandon = async () => {
    if (!confirm(t('session.abandonConfirm'))) return
    if (!sessionIdRef.current) { navigate('/routines'); return }
    await sessionService.finish(sessionIdRef.current, {
      status: 'abandoned',
      duration_seconds: globalSecs,
    })
    if (globalTimer.current) clearInterval(globalTimer.current)
    navigate('/routines')
  }

  // ── Computed progress
  const totalSets     = exercises.reduce((s, e) => s + e.sets, 0)
  const doneSets      = completedSets.length
  const progressPct   = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0

  const setsCompletedForEx = (exerciseId: number) =>
    completedSets.filter(s => s.exercise_id === exerciseId).length

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!currentEx) return (
    <div className="text-center py-20 text-neutral-500 font-medium">{t('session.noExercises')}</div>
  )

  return (
    <div className="max-w-4xl mx-auto px-6 py-6">

      {/* ── PR Toast ── */}
      {newPRs.length > 0 && (
        <div className="fixed top-4 right-4 bg-accent text-neutral-900 px-5 py-3 shadow-modal font-bold z-50 animate-bounce rounded-2xl">
          <i className="bi bi-trophy-fill mr-2" />{t('session.newPR')} {newPRs[0]}!
        </div>
      )}

      {/* ── Adaptive Rest Toast ── */}
      {adaptiveRestMsg && (
        <div className="fixed top-4 left-4 bg-blue-600 text-white px-5 py-3 shadow-modal font-bold z-50 rounded-2xl">
          <i className="bi bi-clock-history mr-2" />{adaptiveRestMsg}
        </div>
      )}

      {/* ── Header ── */}
      <GlowCard className="mb-5">
        <div className="p-5">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-black text-white truncate">{routineName}</h1>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-black text-accent">{fmtTime(globalSecs)}</span>
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
                <p className="text-6xl font-bold text-white mb-4">{fmtTime(restSecs)}</p>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-5">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${(restSecs / (currentEx.rest_seconds || 60)) * 100}%` }}
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
                <p className="text-6xl font-bold text-white mb-4">{fmtTime(exerciseSecs)}</p>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-5">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${(exerciseSecs / (currentEx.duration_seconds || 30)) * 100}%` }}
                  />
                </div>
                <button
                  onClick={() => {
                    if (exerciseTimer.current) { clearInterval(exerciseTimer.current); exerciseTimer.current = null }
                    handleCompleteSet(currentEx.duration_seconds! - exerciseSecs)
                  }}
                  className="btn-primary"
                >
                  {t('session.finishEarly')}
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
                          <label className="form-label">{t('session.increment')}</label>
                          <input
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
                  <label className="form-label">
                    {t('session.repsGoal')} {currentEx.reps ?? '—'})
                  </label>
                  <input
                    type="number" min={0}
                    value={setInput.reps}
                    onChange={e => setSetInput(p => ({ ...p, reps: Number(e.target.value) }))}
                    className="form-input text-xl font-black text-center"
                  />
                </div>
                <div>
                  <label className="form-label">
                    {t('session.weightSuggested')} {currentEx.weight_suggestion ? `${currentEx.weight_suggestion})` : ')'}
                  </label>
                  <input
                    type="number" min={0} step={0.5}
                    value={setInput.weight_kg}
                    onChange={e => setSetInput(p => ({ ...p, weight_kg: e.target.value }))}
                    placeholder="—"
                    className="form-input text-xl font-black text-center"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">
                  {t('session.rpeLabel')} <strong className="text-accent">{setInput.rpe}</strong>/10
                </label>
                <input
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
                <label className="form-label">{t('session.setNote')}</label>
                <input
                  type="text"
                  value={setInput.notes}
                  onChange={e => setSetInput(p => ({ ...p, notes: e.target.value }))}
                  placeholder={t('session.shoulderPainPlaceholder')}
                  className="form-input"
                />
              </div>

                <button
                  onClick={() => handleCompleteSet()}
                  className="w-full btn-primary py-3.5 font-bold text-sm uppercase tracking-wider"
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
                  className="flex-1 border border-white/15 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white font-semibold text-xs uppercase tracking-wider px-6 py-2.5 rounded-full transition-all"
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
                      className={`w-full text-left px-3 py-2 text-sm transition-colors rounded-xl ${
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
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md">
            <GlowCard>
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-1">{t('session.finishSession')}</h2>
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
                  <label className="form-label">{t('session.workoutNotes')}</label>
                  <textarea
                    rows={3}
                    value={finishNotes}
                    onChange={e => setFinishNotes(e.target.value)}
                    placeholder={t('session.goodWorkoutPlaceholder')}
                    className="form-input resize-none"
                  />
                </div>

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
          </div>
        </div>
      )}
    </div>
  )
}
