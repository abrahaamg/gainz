import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { exerciseService } from '../services/exerciseService'
import { useDebounce } from '../hooks/useDebounce'
import { Exercise, ExerciseCategory, Difficulty } from '../types/exercise'

const CATEGORY_COLORS: Record<ExerciseCategory, string> = {
  strength:    'bg-blue-100 text-blue-800',
  cardio:      'bg-red-100 text-red-800',
  flexibility: 'bg-green-100 text-green-800',
  hiit:        'bg-orange-100 text-orange-800',
  balance:     'bg-purple-100 text-purple-800',
}

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  strength: 'Fuerza', cardio: 'Cardio', flexibility: 'Flexibilidad',
  hiit: 'HIIT', balance: 'Equilibrio',
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Fácil', medium: 'Media', hard: 'Difícil',
}

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'text-green-600', medium: 'text-yellow-600', hard: 'text-red-600',
}

const CATEGORIES: ExerciseCategory[] = ['strength', 'cardio', 'flexibility', 'hiit', 'balance']

export default function ExercisesPage() {
  const navigate = useNavigate()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ExerciseCategory | ''>('')
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('')

  const debouncedSearch = useDebounce(search, 300)

  const LIMIT = 12

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, category, difficulty])

  useEffect(() => {
    const fetchExercises = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await exerciseService.getAll({
          q: debouncedSearch || undefined,
          category: category || undefined,
          difficulty: difficulty || undefined,
          page,
          limit: LIMIT,
        })
        setExercises(result.data)
        setTotal(result.pagination.total)
      } catch {
        setError('Error al cargar los ejercicios')
      } finally {
        setLoading(false)
      }
    }
    fetchExercises()
  }, [debouncedSearch, category, difficulty, page])

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ejercicios</h1>
          <p className="text-gray-500 text-sm">{total} ejercicios en el catálogo</p>
        </div>
        <button
          onClick={() => navigate('/exercises/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nuevo ejercicio
        </button>
      </div>

      {/* Buscador */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar ejercicio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filtros por categoría */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setCategory('')}
          className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
            category === '' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
          }`}
        >
          Todos
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat === category ? '' : cat)}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
              category === cat
                ? CATEGORY_COLORS[cat] + ' border-transparent'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Filtro dificultad */}
      <div className="flex gap-2 mb-6">
        {(['', 'easy', 'medium', 'hard'] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className={`px-3 py-1 rounded text-sm border transition-colors ${
              difficulty === d
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
            }`}
          >
            {d === '' ? 'Todas' : DIFFICULTY_LABELS[d]}
          </button>
        ))}
      </div>

      {/* Estado de carga / error */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-40 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>
      )}

      {/* Grid de ejercicios */}
      {!loading && !error && exercises.length === 0 && (
        <div className="text-center py-16 text-gray-400">No se encontraron ejercicios</div>
      )}

      {!loading && !error && exercises.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              onClick={() => navigate(`/exercises/${exercise.id}`)}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[exercise.category]}`}>
                  {CATEGORY_LABELS[exercise.category]}
                </span>
                <span className={`text-xs font-medium ${DIFFICULTY_COLORS[exercise.difficulty]}`}>
                  {DIFFICULTY_LABELS[exercise.difficulty]}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 leading-tight">{exercise.name}</h3>
              <p className="text-sm text-gray-500 capitalize">{exercise.muscle_group.replace('_', ' ')}</p>
              {exercise.requires_equipment && (
                <span className="mt-2 inline-block text-xs text-gray-400">🏋️ Requiere equipo</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            ← Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}
