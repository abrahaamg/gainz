import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { equipmentService } from '../services/equipmentService'
import { Recommendation } from '../types/equipment'

const GOAL_LABELS: Record<string, string> = {
  strength:    'Fuerza',
  cardio:      'Cardio',
  weight_loss: 'Pérdida de peso',
  flexibility: 'Flexibilidad',
  general:     'General',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy:   'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard:   'bg-red-100 text-red-800',
}

function CompatBadge({ pct }: { pct: number }) {
  const color = pct >= 90 ? 'bg-green-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-orange-500'
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-20">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${color}`}>
        {pct}%
      </span>
    </div>
  )
}

export default function RecommendationsPage() {
  const navigate = useNavigate()
  const [recs, setRecs]           = useState<Recommendation[]>([])
  const [loading, setLoading]     = useState(true)
  const [goalFilter, setGoal]     = useState('')
  const [diffFilter, setDiff]     = useState('')
  const [hasEquipment, setHasEquipment] = useState(true)

  const load = (goal?: string, difficulty?: string) => {
    setLoading(true)
    equipmentService.getRecommendations({ goal: goal || undefined, difficulty: difficulty || undefined })
      .then(setRecs)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    // Check if user has any equipment
    equipmentService.getAll().then(({ items }) => setHasEquipment(items.length > 0))
    load()
  }, [])

  const handleFilter = (goal: string, diff: string) => {
    setGoal(goal); setDiff(diff)
    load(goal, diff)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recomendaciones</h1>
          <p className="text-gray-500 text-sm mt-1">Rutinas públicas compatibles con tu equipamiento</p>
        </div>
        <Link to="/equipment" className="text-sm text-indigo-600 hover:underline">
          ⚙️ Gestionar equipo
        </Link>
      </div>

      {/* No equipment banner */}
      {!hasEquipment && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <p className="text-sm text-yellow-800">
            Sin equipo registrado — solo se muestran rutinas de peso corporal
          </p>
          <Link to="/equipment" className="text-sm font-semibold text-yellow-700 hover:underline">
            Añadir equipo →
          </Link>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={goalFilter}
          onChange={e => handleFilter(e.target.value, diffFilter)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Todos los objetivos</option>
          {Object.entries(GOAL_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={diffFilter}
          onChange={e => handleFilter(goalFilter, e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Todas las dificultades</option>
          <option value="easy">Fácil</option>
          <option value="medium">Media</option>
          <option value="hard">Difícil</option>
        </select>
        {(goalFilter || diffFilter) && (
          <button
            onClick={() => handleFilter('', '')}
            className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-lg"
          >
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : recs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium">No hay rutinas compatibles con tu equipo actual</p>
          <p className="text-sm mt-1">Prueba a añadir más equipo o cambia los filtros</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recs.map(rec => (
            <div key={rec.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-gray-900 text-lg">{rec.name}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[rec.difficulty] ?? 'bg-gray-100 text-gray-600'}`}>
                      {rec.difficulty}
                    </span>
                    {rec.goal && (
                      <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                        {GOAL_LABELS[rec.goal] ?? rec.goal}
                      </span>
                    )}
                  </div>

                  {rec.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{rec.description}</p>
                  )}

                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                    <span>💪 {rec.total_exercises} ejercicios</span>
                    {rec.estimated_duration_min && <span>⏱ {rec.estimated_duration_min} min</span>}
                    <span>✅ {rec.times_completed} veces completada</span>
                    <span className="text-green-600">
                      {rec.compatible_exercises}/{rec.total_exercises} ejercicios compatibles
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0">
                  <CompatBadge pct={rec.compatibility_pct} />
                  <button
                    onClick={() => navigate(`/session/${rec.id}`)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold"
                  >
                    ▶ Empezar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
