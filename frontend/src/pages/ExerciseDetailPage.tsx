import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { exerciseService } from '../services/exerciseService'
import { Exercise, ExerciseCategory, Difficulty } from '../types/exercise'

const CATEGORY_COLORS: Record<ExerciseCategory, string> = {
  strength: 'bg-blue-100 text-blue-800',
  cardio: 'bg-red-100 text-red-800',
  flexibility: 'bg-green-100 text-green-800',
  hiit: 'bg-orange-100 text-orange-800',
  balance: 'bg-purple-100 text-purple-800',
}

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  strength: 'Fuerza', cardio: 'Cardio', flexibility: 'Flexibilidad',
  hiit: 'HIIT', balance: 'Equilibrio',
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Fácil', medium: 'Media', hard: 'Difícil',
}

export default function ExerciseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await exerciseService.getById(parseInt(id!, 10))
        setExercise(data)
      } catch {
        setError('Ejercicio no encontrado')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  const handleDelete = async () => {
    if (!exercise) return
    if (!confirm(`¿Eliminar "${exercise.name}"? Esta acción no se puede deshacer.`)) return
    setDeleting(true)
    try {
      await exerciseService.delete(exercise.id)
      navigate('/exercises')
    } catch {
      setError('Error al eliminar el ejercicio')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-1/2" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (error || !exercise) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>
        <button onClick={() => navigate('/exercises')} className="mt-4 text-blue-600 hover:underline">
          ← Volver a ejercicios
        </button>
      </div>
    )
  }

  const instructions = exercise.instructions
    ? exercise.instructions.split('\n').filter(Boolean)
    : []

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Navegación */}
      <button onClick={() => navigate('/exercises')} className="text-blue-600 hover:underline text-sm mb-6 flex items-center gap-1">
        ← Volver a ejercicios
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${CATEGORY_COLORS[exercise.category]}`}>
              {CATEGORY_LABELS[exercise.category]}
            </span>
            <span className="text-sm text-gray-500">{DIFFICULTY_LABELS[exercise.difficulty]}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{exercise.name}</h1>
          <p className="text-gray-600 mt-1 capitalize">{exercise.muscle_group.replace('_', ' ')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/exercises/${exercise.id}/edit`)}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Editar
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>

      {/* Descripción */}
      {exercise.description && (
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-gray-700">{exercise.description}</p>
        </div>
      )}

      {/* Instrucciones */}
      {instructions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Instrucciones</h2>
          <ol className="space-y-2">
            {instructions.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-gray-700">{step.replace(/^\d+\.\s*/, '')}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Músculos secundarios */}
      {exercise.secondary_muscles.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Músculos secundarios</h2>
          <div className="flex flex-wrap gap-2">
            {exercise.secondary_muscles.map((m) => (
              <span key={m} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm capitalize">
                {m.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Equipamiento */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Equipamiento</h2>
        {exercise.requires_equipment && exercise.equipment.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {exercise.equipment.map((eq) => (
              <span key={eq} className="bg-yellow-50 text-yellow-800 border border-yellow-200 px-3 py-1 rounded-full text-sm">
                🏋️ {eq}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-green-600 text-sm">✅ Sin equipamiento necesario</span>
        )}
      </div>

      {/* Notas del creador — NIVEL 1 */}
      {exercise.notes && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h2 className="text-sm font-semibold text-blue-800 mb-1">💡 Notas del creador</h2>
          <p className="text-blue-900 text-sm">{exercise.notes}</p>
        </div>
      )}

      {/* Video */}
      {exercise.video_url && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Video de referencia</h2>
          <a href={exercise.video_url} target="_blank" rel="noreferrer"
            className="text-blue-600 hover:underline text-sm">
            Ver en YouTube →
          </a>
        </div>
      )}

      {/* Calculadora 1RM — se implementa en Módulo 6 */}
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 text-center text-gray-400 text-sm">
        📊 Calculadora 1RM — disponible en Módulo 6
      </div>
    </div>
  )
}
