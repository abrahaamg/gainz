import { useEffect, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { progressService } from '../services/progressService'
import {
  ChartsData, ExerciseOption, PersonalRecord,
  ProgressionPoint, Badge, StreakStats,
} from '../types/progress'

const PERIODS = [
  { label: '7 días',  value: 7 },
  { label: '30 días', value: 30 },
  { label: '90 días', value: 90 },
]

const RECORD_LABELS: Record<string, string> = {
  max_weight:   'Peso máximo',
  max_reps:     'Máx repeticiones',
  max_duration: 'Máx duración',
}

const RECORD_UNITS: Record<string, string> = {
  max_weight:   'kg',
  max_reps:     'reps',
  max_duration: 's',
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-gray-800 mb-3">{children}</h2>
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-32 text-gray-300 text-sm">
      Sin datos de {label} en este período
    </div>
  )
}

export default function ProgressPage() {
  const [days, setDays]               = useState(30)
  const [charts, setCharts]           = useState<ChartsData | null>(null)
  const [exercises, setExercises]     = useState<ExerciseOption[]>([])
  const [selectedEx, setSelectedEx]   = useState<number | null>(null)
  const [progression, setProgression] = useState<ProgressionPoint[]>([])
  const [records, setRecords]         = useState<PersonalRecord[]>([])
  const [streak, setStreak]           = useState<StreakStats | null>(null)
  const [badges, setBadges]           = useState<Badge[]>([])
  const [loadingCharts, setLoadingCharts] = useState(true)

  // Load charts when period changes
  useEffect(() => {
    setLoadingCharts(true)
    progressService.getCharts(days)
      .then(setCharts)
      .finally(() => setLoadingCharts(false))
  }, [days])

  // Load static data once
  useEffect(() => {
    progressService.getTrainedExercises().then(exs => {
      setExercises(exs)
      if (exs.length) {
        setSelectedEx(exs[0].id)
        progressService.getExerciseProgression(exs[0].id).then(setProgression)
      }
    })
    progressService.getRecords().then(setRecords)
    progressService.getStats().then(({ streak: s, badges: b }) => {
      setStreak(s)
      setBadges(b)
    })
  }, [])

  const handleExerciseChange = (id: number) => {
    setSelectedEx(id)
    progressService.getExerciseProgression(id).then(setProgression)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* Header + period selector */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Progreso</h1>
          <p className="text-gray-500 text-sm mt-1">Estadísticas de tus entrenamientos</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setDays(p.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                days === p.value
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Streak summary */}
      {streak && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Racha actual', value: `${streak.current_streak} días`, icon: '🔥' },
            { label: 'Mejor racha',  value: `${streak.longest_streak} días`,  icon: '🏆' },
            { label: 'Entrenamientos', value: streak.total_workouts,           icon: '💪' },
            { label: 'Minutos totales', value: streak.total_minutes,           icon: '⏱️' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm text-center">
              <p className="text-2xl mb-1">{icon}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <section>
          <SectionTitle>Logros</SectionTitle>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {badges.map(b => (
              <div
                key={b.id}
                title={b.description}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${
                  b.earned
                    ? 'border-indigo-200 bg-indigo-50'
                    : 'border-gray-100 bg-gray-50 opacity-40 grayscale'
                }`}
              >
                <span className="text-2xl">{b.icon}</span>
                <p className="text-xs font-medium text-gray-700 leading-tight">{b.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {loadingCharts ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : charts && (
        <>
          {/* Frequency chart */}
          <section>
            <SectionTitle>Sesiones completadas</SectionTitle>
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              {charts.frequency.length === 0 ? (
                <EmptyChart label="sesiones" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={charts.frequency} barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={d => d} formatter={(v: number) => [v, 'sesiones']} />
                    <Bar dataKey="sessions" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* Volume chart */}
          <section>
            <SectionTitle>Volumen total (kg levantados)</SectionTitle>
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              {charts.volume.length === 0 ? (
                <EmptyChart label="volumen" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={charts.volume}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={d => d} formatter={(v: number) => [`${v} kg`, 'volumen']} />
                    <Line type="monotone" dataKey="volume_kg" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* Duration chart */}
          <section>
            <SectionTitle>Duración por sesión (min)</SectionTitle>
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              {charts.duration.length === 0 ? (
                <EmptyChart label="duración" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={charts.duration}>
                    <defs>
                      <linearGradient id="durationGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={d => d} formatter={(v: number) => [`${v} min`, 'duración']} />
                    <Area type="monotone" dataKey="duration_min" stroke="#6366f1" strokeWidth={2} fill="url(#durationGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* Muscle distribution radar */}
          <section>
            <SectionTitle>Distribución muscular</SectionTitle>
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              {charts.muscles.length === 0 ? (
                <EmptyChart label="músculos" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={charts.muscles}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="muscle_group" tick={{ fontSize: 11 }} />
                    <Radar dataKey="sets" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.35} />
                    <Tooltip formatter={(v: number) => [v, 'series']} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
        </>
      )}

      {/* Exercise progression */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Progresión de ejercicio</SectionTitle>
          <select
            value={selectedEx ?? ''}
            onChange={e => handleExerciseChange(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            {exercises.length === 0 && <option value="">Sin datos</option>}
            {exercises.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          {progression.length === 0 ? (
            <EmptyChart label="progresión" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={progression}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={d => d} formatter={(v: number) => [`${v} kg`, 'peso máx']} />
                <Line type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Personal records */}
      <section>
        <SectionTitle>Récords personales</SectionTitle>
        {records.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            Aún no tienes récords registrados
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Ejercicio</th>
                  <th className="text-left px-4 py-3">Tipo</th>
                  <th className="text-right px-4 py-3">Valor</th>
                  <th className="text-right px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map(pr => (
                  <tr key={pr.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{pr.exercise_name}</td>
                    <td className="px-4 py-3 text-gray-500">{RECORD_LABELS[pr.record_type]}</td>
                    <td className="px-4 py-3 text-right font-bold text-indigo-600">
                      {pr.value} {RECORD_UNITS[pr.record_type]}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400">
                      {new Date(pr.achieved_at).toLocaleDateString('es-ES')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
