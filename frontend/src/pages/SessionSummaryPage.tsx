import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { sessionService } from '../services/sessionService'
import { Session, SessionExercise } from '../types/session'

function fmtTime(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s}s`
}

export default function SessionSummaryPage() {
  const { routineId } = useParams<{ routineId: string }>()  // used as sessionId here
  const [session, setSession]     = useState<Session | null>(null)
  const [exercises, setExercises] = useState<SessionExercise[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    sessionService.getById(Number(routineId))
      .then(s => {
        setSession(s)
        setExercises(s.exercises ?? [])
      })
      .finally(() => setLoading(false))
  }, [routineId])

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
    </div>
  )

  if (!session) return (
    <div className="text-center py-16 text-red-500">Sesión no encontrada.</div>
  )

  // Stats
  const completedSets = exercises.filter(e => e.completed)
  const totalSets     = completedSets.length

  // Volume: Σ reps_done × weight_kg
  const totalVolume = completedSets.reduce((sum, e) => {
    if (e.reps_done && e.weight_kg) return sum + e.reps_done * e.weight_kg
    return sum
  }, 0)

  // Group by exercise for the list
  const byExercise = completedSets.reduce<Record<number, { name: string; sets: SessionExercise[] }>>(
    (acc, ex) => {
      const key = ex.exercise_id
      if (!acc[key]) acc[key] = { name: ex.exercise_name ?? `Ejercicio ${key}`, sets: [] }
      acc[key].sets.push(ex)
      return acc
    },
    {}
  )

  // Check streaks from summary (we just show what we have)
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* ── Header ── */}
      <div className="text-center mb-8">
        <p className="text-5xl mb-3">🏆</p>
        <h1 className="text-3xl font-black text-gray-900">¡Sesión completada!</h1>
        {session.routine_name && (
          <p className="text-gray-500 mt-1">{session.routine_name}</p>
        )}
        {session.rating && (
          <p className="text-yellow-400 text-2xl mt-2">
            {'★'.repeat(session.rating)}{'☆'.repeat(5 - session.rating)}
          </p>
        )}
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-indigo-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-indigo-600">
            {session.duration_seconds ? fmtTime(session.duration_seconds) : '—'}
          </p>
          <p className="text-xs text-indigo-700 mt-1">Duración real</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-green-600">{totalSets}</p>
          <p className="text-xs text-green-700 mt-1">Series completadas</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-orange-600">
            {totalVolume > 0 ? `${Math.round(totalVolume).toLocaleString()} kg` : '—'}
          </p>
          <p className="text-xs text-orange-700 mt-1">Volumen total</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-red-600">
            {session.calories_burned ?? '—'}
          </p>
          <p className="text-xs text-red-700 mt-1">Calorías est.</p>
        </div>
      </div>

      {/* ── Notes ── */}
      {session.notes && (
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-1">📝 Notas del entrenamiento</p>
          <p className="text-sm text-gray-600">{session.notes}</p>
        </div>
      )}

      {/* ── Exercise breakdown ── */}
      {Object.keys(byExercise).length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-gray-800 mb-3">Desglose por ejercicio</h2>
          <div className="space-y-3">
            {Object.values(byExercise).map(({ name, sets }) => {
              const maxWeight = Math.max(...sets.map(s => s.weight_kg ?? 0))
              return (
                <div key={name} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-gray-900">{name}</p>
                    {maxWeight > 0 && (
                      <span className="text-sm text-indigo-600 font-medium">
                        Máx: {maxWeight} kg
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sets.map(s => (
                      <span
                        key={s.set_number}
                        className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-lg"
                      >
                        S{s.set_number}:{' '}
                        {s.reps_done ? `${s.reps_done} reps` : ''}
                        {s.weight_kg ? ` · ${s.weight_kg}kg` : ''}
                        {s.duration_done_sec ? `${s.duration_done_sec}s` : ''}
                        {s.rpe ? ` · RPE ${s.rpe}` : ''}
                      </span>
                    ))}
                  </div>
                  {/* Notas NIVEL 3 por serie */}
                  {sets.some(s => s.notes) && (
                    <div className="mt-2 space-y-1">
                      {sets.filter(s => s.notes).map(s => (
                        <p key={s.set_number} className="text-xs text-gray-400 italic">
                          S{s.set_number}: {s.notes}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex gap-3">
        <Link
          to="/"
          className="flex-1 text-center border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl text-sm font-medium"
        >
          Volver al inicio
        </Link>
        <Link
          to="/progress"
          className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-bold"
        >
          Ver progreso →
        </Link>
      </div>
    </div>
  )
}
