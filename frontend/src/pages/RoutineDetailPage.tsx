import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { routineService } from '../services/routineService'
import { Routine, RoutineExercise } from '../types/routine'

const CATEGORY_COLORS: Record<string, string> = {
  strength:    'bg-blue-100 text-blue-800',
  cardio:      'bg-red-100 text-red-800',
  hiit:        'bg-orange-100 text-orange-800',
  flexibility: 'bg-green-100 text-green-800',
  balance:     'bg-purple-100 text-purple-800',
}

const GOAL_LABELS: Record<string, string> = {
  strength:    'Fuerza',
  cardio:      'Cardio',
  weight_loss: 'Pérdida de peso',
  flexibility: 'Flexibilidad',
  general:     'General',
}

export default function RoutineDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [routine, setRoutine]   = useState<Routine | null>(null)
  const [exercises, setExercises] = useState<RoutineExercise[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    routineService.getById(Number(id))
      .then(r => {
        setRoutine(r)
        setExercises(r.exercises ?? [])
      })
      .catch(() => setError('Rutina no encontrada'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta rutina?')) return
    await routineService.delete(Number(id))
    navigate('/routines')
  }

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
    </div>
  )

  if (error || !routine) return (
    <div className="text-center py-16 text-red-500">{error ?? 'Error'}</div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link to="/routines" className="text-sm text-indigo-600 hover:underline mb-2 block">
            ← Volver a rutinas
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{routine.name}</h1>
          {routine.description && (
            <p className="text-gray-500 mt-1">{routine.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            to={`/routines/${routine.id}/edit`}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Editar
          </Link>
          <button
            onClick={handleDelete}
            className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-3 mb-6 text-sm">
        {routine.goal && (
          <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium">
            🎯 {GOAL_LABELS[routine.goal] ?? routine.goal}
          </span>
        )}
        {routine.estimated_duration_min && (
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
            ⏱ {routine.estimated_duration_min} min estimados
          </span>
        )}
        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
          💪 {exercises.length} ejercicios
        </span>
        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
          ✅ Completada {routine.times_completed} veces
        </span>
      </div>

      {/* Warmup notes */}
      {routine.warmup_notes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-yellow-800 mb-1">🔥 Calentamiento</p>
          <p className="text-sm text-yellow-700">{routine.warmup_notes}</p>
        </div>
      )}

      {/* Exercises list */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Ejercicios</h2>
        {exercises.length === 0 ? (
          <p className="text-gray-400 text-sm">Esta rutina no tiene ejercicios.</p>
        ) : (
          exercises.map((ex, i) => (
            <div key={ex.re_id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 font-mono text-sm w-5">{i + 1}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{ex.exercise_name}</p>
                    <div className="flex gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[ex.category] ?? 'bg-gray-100 text-gray-600'}`}>
                        {ex.category}
                      </span>
                      <span className="text-xs text-gray-500">{ex.muscle_group}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right text-sm text-gray-700 space-y-0.5">
                  <p className="font-medium">
                    {ex.sets} series ×{' '}
                    {ex.reps ? `${ex.reps} reps` : `${ex.duration_seconds}s`}
                  </p>
                  <p className="text-xs text-gray-400">Descanso: {ex.rest_seconds}s</p>
                  {ex.weight_suggestion && (
                    <p className="text-xs text-indigo-600">Peso sugerido: {ex.weight_suggestion} kg</p>
                  )}
                </div>
              </div>

              {/* Nota NIVEL 2: creador de la rutina para este ejercicio */}
              {ex.notes && (
                <div className="mt-3 bg-indigo-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-indigo-700">
                    <span className="font-semibold">Nota de rutina:</span> {ex.notes}
                  </p>
                </div>
              )}

              {/* Nota NIVEL 1: creador del ejercicio */}
              {ex.exercise_notes && (
                <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold">Nota del ejercicio:</span> {ex.exercise_notes}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Cooldown notes */}
      {routine.cooldown_notes && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <p className="text-sm font-semibold text-blue-800 mb-1">❄️ Enfriamiento</p>
          <p className="text-sm text-blue-700">{routine.cooldown_notes}</p>
        </div>
      )}
    </div>
  )
}
