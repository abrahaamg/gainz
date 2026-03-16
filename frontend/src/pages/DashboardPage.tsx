import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { routineService } from '../services/routineService'
import { progressService } from '../services/progressService'
import { Routine } from '../types/routine'
import { StreakStats, FrequencyPoint } from '../types/progress'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner:     'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced:     'bg-red-100 text-red-700',
}

const GOAL_LABELS: Record<string, string> = {
  strength:    'Fuerza',
  cardio:      'Cardio',
  weight_loss: 'Pérdida de peso',
  flexibility: 'Flexibilidad',
  general:     'General',
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [routines, setRoutines]   = useState<Routine[]>([])
  const [streak, setStreak]       = useState<StreakStats | null>(null)
  const [frequency, setFrequency] = useState<FrequencyPoint[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      routineService.getAll(),
      progressService.getStats(),
      progressService.getCharts(30),
    ]).then(([rts, { streak: s }, charts]) => {
      setRoutines(rts)
      setStreak(s)
      setFrequency(charts.frequency)
    }).finally(() => setLoading(false))
  }, [])

  // Weekly stats from frequency (last 7 days)
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - 6)
  weekStart.setHours(0, 0, 0, 0)
  const weekSessions = frequency.filter(f => new Date(f.date) >= weekStart)
    .reduce((acc, f) => acc + f.sessions, 0)

  const recentRoutines = [...routines]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5)

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Bienvenido de vuelta 👋</p>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 text-white shadow">
          <p className="text-4xl mb-1">🔥</p>
          <p className="text-4xl font-black">{streak?.current_streak ?? 0}</p>
          <p className="text-sm opacity-90 mt-0.5">días de racha</p>
          {streak?.longest_streak ? (
            <p className="text-xs opacity-70 mt-1">Mejor: {streak.longest_streak} días</p>
          ) : null}
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-2xl mb-1">🏋️</p>
          <p className="text-3xl font-bold text-gray-900">{streak?.total_workouts ?? 0}</p>
          <p className="text-xs text-gray-400 mt-0.5">entrenamientos</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-2xl mb-1">📅</p>
          <p className="text-3xl font-bold text-gray-900">{weekSessions}</p>
          <p className="text-xs text-gray-400 mt-0.5">sesiones esta semana</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-2xl mb-1">⏱️</p>
          <p className="text-3xl font-bold text-gray-900">{streak?.total_minutes ?? 0}</p>
          <p className="text-xs text-gray-400 mt-0.5">minutos totales</p>
        </div>
      </div>

      {/* Mini frequency chart (last 30 days) */}
      {frequency.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-700 mb-3">Actividad — últimos 30 días</h2>
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={frequency} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={20} />
                <Tooltip labelFormatter={d => d} formatter={(v: number) => [v, 'sesiones']} />
                <Bar dataKey="sessions" fill="#6366f1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Quick start — recent routines */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-semibold text-gray-700">Inicio rápido</h2>
          <Link to="/routines" className="text-sm text-indigo-600 hover:underline">Ver todas →</Link>
        </div>

        {recentRoutines.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400">
            <p className="text-3xl mb-2">📋</p>
            <p className="font-medium">No tienes rutinas todavía</p>
            <Link to="/routines/new" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
              Crear primera rutina →
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentRoutines.map(r => (
              <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{r.name}</p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[r.difficulty] ?? 'bg-gray-100 text-gray-600'}`}>
                        {r.difficulty}
                      </span>
                      {r.goal && (
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                          {GOAL_LABELS[r.goal] ?? r.goal}
                        </span>
                      )}
                    </div>
                  </div>
                  {r.estimated_duration_min && (
                    <span className="text-xs text-gray-400 shrink-0">⏱ {r.estimated_duration_min} min</span>
                  )}
                </div>

                <div className="flex gap-2 text-xs text-gray-400">
                  {r.exercise_count !== undefined && <span>💪 {r.exercise_count} ejercicios</span>}
                  <span>✅ {r.times_completed}x</span>
                </div>

                <button
                  onClick={() => navigate(`/session/${r.id}`)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-1.5 rounded-lg text-sm font-bold"
                >
                  ▶ Empezar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Links to other sections */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Accesos rápidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Ejercicios',       icon: '🏋️', to: '/exercises' },
            { label: 'Rutinas',          icon: '📋', to: '/routines' },
            { label: 'Progreso',         icon: '📈', to: '/progress' },
            { label: 'Equipamiento',     icon: '⚙️', to: '/equipment' },
          ].map(({ label, icon, to }) => (
            <Link
              key={to}
              to={to}
              className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm text-center hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
            >
              <p className="text-2xl mb-1">{icon}</p>
              <p className="text-sm font-medium text-gray-700">{label}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
