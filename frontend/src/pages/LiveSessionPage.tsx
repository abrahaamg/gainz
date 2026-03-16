import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { routineService } from '../services/routineService'
import { sessionService } from '../services/sessionService'
import { RoutineExercise } from '../types/routine'

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

  // Session data
  const sessionIdRef              = useRef<number | null>(null)
  const sessionCreated            = useRef(false)
  const [exercises, setExercises] = useState<RoutineExercise[]>([])
  const [routineName, setRoutineName] = useState('')
  const [loading, setLoading]     = useState(true)

  // Navigation
  const [exIdx, setExIdx]   = useState(0)
  const [setIdx, setSetIdx] = useState(1)  // 1-based

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

  // Finish modal
  const [showModal, setShowModal]       = useState(false)
  const [finishNotes, setFinishNotes]   = useState('')
  const [finishRating, setFinishRating] = useState(4)
  const [saving, setSaving]             = useState(false)

  const currentEx = exercises[exIdx] as RoutineExercise | undefined
  const isTimed   = currentEx ? currentEx.duration_seconds !== null : false

  // ── Global stopwatch ─────────────────────────────────────────
  const startGlobalTimer = useCallback(() => {
    if (globalTimer.current) return
    globalTimer.current = setInterval(() => setGlobalSecs(s => s + 1), 1000)
  }, [])

  // ── Init: fetch routine + create session ─────────────────────
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

        // Pre-fill first set
        if (exs.length > 0) {
          setSetInput({
            reps: exs[0].reps ?? 10,
            weight_kg: exs[0].weight_suggestion?.toString() ?? '',
            rpe: 7,
            notes: '',
          })
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

  // ── Move to next set or exercise ─────────────────────────────
  const goNext = useCallback(() => {
    if (!currentEx) return
    const isLastSet = setIdx >= currentEx.sets
    const isLastEx  = exIdx >= exercises.length - 1

    if (isLastSet && isLastEx) {
      // Session done — open finish modal
      setShowModal(true)
      return
    }

    if (isLastSet) {
      // Next exercise
      const nextIdx = exIdx + 1
      const next    = exercises[nextIdx]
      setExIdx(nextIdx)
      setSetIdx(1)
      setSetInput({
        reps: next.reps ?? 10,
        weight_kg: next.weight_suggestion?.toString() ?? '',
        rpe: 7,
        notes: '',
      })
      if (next.duration_seconds) {
        setExerciseSecs(next.duration_seconds)
        setPhase('timing')
        startExerciseTimer(next.duration_seconds)
      } else {
        setPhase('working')
      }
    } else {
      // Next set
      setSetIdx(s => s + 1)
      setPhase('working')
    }
  }, [currentEx, setIdx, exIdx, exercises])

  // ── Start rest timer ─────────────────────────────────────────
  const startRest = useCallback((restDuration: number) => {
    if (restTimer.current) clearInterval(restTimer.current)
    setRestSecs(restDuration)
    setPhase('resting')
    restTimer.current = setInterval(() => {
      setRestSecs(prev => {
        if (prev <= 1) {
          clearInterval(restTimer.current!)
          restTimer.current = null
          // Vibrate on rest end
          if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
          goNext()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [goNext])

  // ── Start exercise countdown timer (timed exercises) ─────────
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

  // ── Complete a set ────────────────────────────────────────────
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
        startRest(currentEx.rest_seconds)
      }
    } catch (err) {
      console.error('Error saving set:', err)
    }
  }, [currentEx, setIdx, setInput, isTimed, exIdx, exercises.length, startRest])

  // ── Skip rest ─────────────────────────────────────────────────
  const skipRest = () => {
    if (restTimer.current) { clearInterval(restTimer.current); restTimer.current = null }
    goNext()
  }

  // ── Skip exercise ─────────────────────────────────────────────
  const skipExercise = () => {
    if (restTimer.current) { clearInterval(restTimer.current); restTimer.current = null }
    const isLastEx = exIdx >= exercises.length - 1
    if (isLastEx) { setShowModal(true); return }
    const nextIdx = exIdx + 1
    const next    = exercises[nextIdx]
    setExIdx(nextIdx)
    setSetIdx(1)
    setPhase('working')
    setSetInput({
      reps: next.reps ?? 10,
      weight_kg: next.weight_suggestion?.toString() ?? '',
      rpe: 7,
      notes: '',
    })
  }

  // ── Jump to exercise ──────────────────────────────────────────
  const jumpTo = (idx: number) => {
    if (restTimer.current) { clearInterval(restTimer.current); restTimer.current = null }
    const ex = exercises[idx]
    setExIdx(idx)
    setSetIdx(1)
    setPhase('working')
    setSetInput({
      reps: ex.reps ?? 10,
      weight_kg: ex.weight_suggestion?.toString() ?? '',
      rpe: 7,
      notes: '',
    })
  }

  // ── Finish session ────────────────────────────────────────────
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

  // ── Abandon session ───────────────────────────────────────────
  const handleAbandon = async () => {
    if (!confirm('¿Abandonar la sesión? Se perderán las series no guardadas.')) return
    if (!sessionIdRef.current) { navigate('/routines'); return }
    await sessionService.finish(sessionIdRef.current, {
      status: 'abandoned',
      duration_seconds: globalSecs,
    })
    if (globalTimer.current) clearInterval(globalTimer.current)
    navigate('/routines')
  }

  // ── Computed progress ─────────────────────────────────────────
  const totalSets     = exercises.reduce((s, e) => s + e.sets, 0)
  const doneSets      = completedSets.length
  const progressPct   = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0

  const setsCompletedForEx = (exerciseId: number) =>
    completedSets.filter(s => s.exercise_id === exerciseId).length

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
    </div>
  )

  if (!currentEx) return (
    <div className="text-center py-20 text-gray-500">No hay ejercicios en esta rutina.</div>
  )

  const CATEGORY_COLORS: Record<string, string> = {
    strength: 'bg-blue-100 text-blue-800', cardio: 'bg-red-100 text-red-800',
    hiit: 'bg-orange-100 text-orange-800', flexibility: 'bg-green-100 text-green-800',
    balance: 'bg-purple-100 text-purple-800',
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* ── PR Toast ── */}
      {newPRs.length > 0 && (
        <div className="fixed top-4 right-4 bg-yellow-400 text-yellow-900 px-4 py-3 rounded-xl shadow-lg font-bold z-50 animate-bounce">
          🏆 ¡Nuevo PR en {newPRs[0]}!
        </div>
      )}

      {/* ── Header ── */}
      <div className="mb-5">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 truncate">{routineName}</h1>
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-bold text-indigo-600">{fmtTime(globalSecs)}</span>
            <button
              onClick={handleAbandon}
              className="text-sm text-red-400 hover:text-red-600 border border-red-200 px-3 py-1 rounded-lg"
            >
              Abandonar
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{doneSets} series completadas</span>
            <span>{totalSets} series totales</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-5 flex-col lg:flex-row">

        {/* ── Main panel ── */}
        <div className="flex-1 space-y-4">

          {/* Exercise header */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{currentEx.exercise_name}</h2>
                <div className="flex gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[currentEx.category] ?? 'bg-gray-100 text-gray-600'}`}>
                    {currentEx.category}
                  </span>
                  <span className="text-xs text-gray-400">{currentEx.muscle_group}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-indigo-600">
                  {setIdx} <span className="text-lg font-normal text-gray-400">/ {currentEx.sets}</span>
                </p>
                <p className="text-xs text-gray-400">serie</p>
              </div>
            </div>

            {/* Nota NIVEL 2: de la rutina para este ejercicio */}
            {currentEx.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-3">
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">💬 </span>{currentEx.notes}
                </p>
              </div>
            )}

            {/* Nota NIVEL 1: del creador del ejercicio */}
            {currentEx.exercise_notes && (
              <p className="text-xs text-gray-400 italic mb-3">{currentEx.exercise_notes}</p>
            )}
          </div>

          {/* ── Rest timer ── */}
          {phase === 'resting' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
              <p className="text-sm font-semibold text-blue-700 mb-2">⏸ Descanso</p>
              <p className="text-5xl font-black text-blue-600 mb-3">{fmtTime(restSecs)}</p>
              <div className="h-2 bg-blue-100 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${(restSecs / (currentEx.rest_seconds || 60)) * 100}%` }}
                />
              </div>
              <button
                onClick={skipRest}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium"
              >
                ⏭ Saltar descanso
              </button>
            </div>
          )}

          {/* ── Exercise countdown (timed) ── */}
          {phase === 'timing' && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 text-center">
              <p className="text-sm font-semibold text-orange-700 mb-2">⏱ Tiempo de ejercicio</p>
              <p className="text-5xl font-black text-orange-600 mb-3">{fmtTime(exerciseSecs)}</p>
              <div className="h-2 bg-orange-100 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-orange-500 transition-all"
                  style={{ width: `${(exerciseSecs / (currentEx.duration_seconds || 30)) * 100}%` }}
                />
              </div>
              <button
                onClick={() => {
                  if (exerciseTimer.current) { clearInterval(exerciseTimer.current); exerciseTimer.current = null }
                  handleCompleteSet(currentEx.duration_seconds! - exerciseSecs)
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-medium"
              >
                Finalizar antes
              </button>
            </div>
          )}

          {/* ── Set inputs (reps mode) ── */}
          {phase === 'working' && !isTimed && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    Reps (objetivo: {currentEx.reps ?? '—'})
                  </label>
                  <input
                    type="number" min={0}
                    value={setInput.reps}
                    onChange={e => setSetInput(p => ({ ...p, reps: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xl font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    Peso kg {currentEx.weight_suggestion ? `(sugerido: ${currentEx.weight_suggestion})` : ''}
                  </label>
                  <input
                    type="number" min={0} step={0.5}
                    value={setInput.weight_kg}
                    onChange={e => setSetInput(p => ({ ...p, weight_kg: e.target.value }))}
                    placeholder="—"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xl font-bold text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  RPE (esfuerzo percibido): <strong>{setInput.rpe}</strong>/10
                </label>
                <input
                  type="range" min={1} max={10}
                  value={setInput.rpe}
                  onChange={e => setSetInput(p => ({ ...p, rpe: Number(e.target.value) }))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>Fácil</span><span>Moderado</span><span>Máximo</span>
                </div>
              </div>

              {/* Nota NIVEL 3: del usuario por serie */}
              <div>
                <label className="block text-sm text-gray-500 mb-1">Nota de serie (opcional)</label>
                <input
                  type="text"
                  value={setInput.notes}
                  onChange={e => setSetInput(p => ({ ...p, notes: e.target.value }))}
                  placeholder='ej. "Me dolió el hombro izquierdo"'
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <button
                onClick={() => handleCompleteSet()}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold text-lg transition-colors"
              >
                ✓ Serie completada
              </button>
            </div>
          )}

          {/* ── Action buttons ── */}
          {phase !== 'resting' && (
            <div className="flex gap-3">
              <button
                onClick={skipExercise}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2 rounded-lg text-sm"
              >
                ⏭ Saltar ejercicio
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2 rounded-lg text-sm font-medium"
              >
                🚩 Finalizar sesión
              </button>
            </div>
          )}
        </div>

        {/* ── Sidebar: exercise list ── */}
        <div className="lg:w-64 bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-fit">
          <p className="text-sm font-semibold text-gray-700 mb-3">Ejercicios</p>
          <ul className="space-y-2">
            {exercises.map((ex, i) => {
              const done  = setsCompletedForEx(ex.exercise_id)
              const total = ex.sets
              const isCurrentEx = i === exIdx
              return (
                <li key={ex.re_id}>
                  <button
                    onClick={() => !isCurrentEx && jumpTo(i)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      isCurrentEx
                        ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold'
                        : done >= total
                        ? 'bg-green-50 text-green-700'
                        : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <span className="mr-2">
                      {done >= total ? '✅' : isCurrentEx ? '🔵' : '⬜'}
                    </span>
                    {ex.exercise_name}
                    <span className="block text-xs text-gray-400 mt-0.5 ml-5">
                      {done}/{total} series
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* ── Finish modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Finalizar sesión</h2>
            <p className="text-sm text-gray-500 mb-5">
              {doneSets} series completadas · {fmtTime(globalSecs)} de duración
            </p>

            {/* Star rating */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Valoración del entrenamiento</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setFinishRating(star)}
                    className={`text-2xl transition-transform hover:scale-110 ${
                      star <= finishRating ? 'text-yellow-400' : 'text-gray-200'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm text-gray-600 mb-1">Notas del entrenamiento</label>
              <textarea
                rows={3}
                value={finishNotes}
                onChange={e => setFinishNotes(e.target.value)}
                placeholder='ej. "Buen entreno, aumentar peso la próxima"'
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm"
              >
                Continuar
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-60"
              >
                {saving ? 'Guardando...' : 'Guardar y finalizar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
