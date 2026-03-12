import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { routineService } from '../services/routineService'
import { Routine } from '../types/routine'

const GOAL_LABELS: Record<string, string> = {
  strength: 'Fuerza',
  cardio: 'Cardio',
  weight_loss: 'Pérdida de peso',
  flexibility: 'Flexibilidad',
  general: 'General',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy:   'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard:   'bg-red-100 text-red-800',
}

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    routineService.getAll()
      .then(setRoutines)
      .catch(() => setError('Error al cargar las rutinas'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm('¿Eliminar esta rutina?')) return
    await routineService.delete(id)
    setRoutines(prev => prev.filter(r => r.id !== id))
  }

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
    </div>
  )

  if (error) return (
    <div className="text-center py-16 text-red-500">{error}</div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mis Rutinas</h1>
        <Link
          to="/routines/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Nueva rutina
        </Link>
      </div>

      {routines.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🏋️</p>
          <p className="text-xl font-medium">No tienes rutinas todavía</p>
          <p className="text-sm mt-2">Crea tu primera rutina para empezar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {routines.map(routine => (
            <Link
              key={routine.id}
              to={`/routines/${routine.id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <h2 className="font-semibold text-gray-900 text-lg leading-tight">{routine.name}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[routine.difficulty] ?? 'bg-gray-100 text-gray-600'}`}>
                  {routine.difficulty}
                </span>
              </div>

              {routine.description && (
                <p className="text-sm text-gray-500 line-clamp-2">{routine.description}</p>
              )}

              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                {routine.goal && (
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                    {GOAL_LABELS[routine.goal] ?? routine.goal}
                  </span>
                )}
                {routine.estimated_duration_min && (
                  <span>⏱ {routine.estimated_duration_min} min</span>
                )}
                {routine.exercise_count !== undefined && (
                  <span>💪 {routine.exercise_count} ejercicios</span>
                )}
                <span>✅ {routine.times_completed} veces</span>
              </div>

              <div className="flex justify-end gap-2 mt-auto pt-2 border-t border-gray-50">
                <button
                  onClick={e => { e.preventDefault(); navigate(`/routines/${routine.id}/edit`) }}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={e => handleDelete(routine.id, e)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
