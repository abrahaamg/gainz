import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { routineService } from '../services/routineService'
import { progressService } from '../services/progressService'
import { Routine } from '../types/routine'
import { StreakStats, FrequencyPoint } from '../types/progress'
import { GOAL_LABELS } from '../utils/labels'
import DifficultyDots from '../components/ui/DifficultyDots'
import AnimatedHero from '../components/ui/AnimatedHero'
import GlowCard from '../components/ui/GlowCard'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
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

  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - 6)
  weekStart.setHours(0, 0, 0, 0)
  const weekSessions = frequency.filter(f => new Date(f.date) >= weekStart)
    .reduce((acc, f) => acc + f.sessions, 0)

  const recentRoutines = [...routines]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 6)

  if (loading) return (
    <div className="flex justify-center items-center py-32">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      {/* ── Hero animado ── */}
      <AnimatedHero />

      {/* ── Bento Grid 4-col: Chart 2x2 left, 4 stats 2x2 right ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Chart — 2x2 left */}
        <GlowCard className="col-span-2 row-span-2">
          <div className="p-6 flex flex-col min-h-[280px] h-full">
            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.12em] mb-3">{t('dashboard.activity30d')}</p>
            {frequency.length > 0 ? (
              <div className="flex-1 min-h-0" style={{ minHeight: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={frequency} barSize={6}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#737373' }} tickFormatter={d => d.slice(5)} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#737373' }} width={20} />
                    <Tooltip
                      labelFormatter={d => d}
                      formatter={(v: number) => [v, t('common.sessions')]}
                      contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', fontSize: 12, color: '#fff' }}
                    />
                    <Bar dataKey="sessions" fill="#F5C400" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <i className="bi bi-bar-chart text-2xl text-neutral-700 mb-2 block" />
                  <p className="text-neutral-600 text-xs font-medium">{t('dashboard.noSessions')}</p>
                  <p className="text-neutral-700 text-[10px] mt-1">{t('dashboard.completeWorkout')}</p>
                </div>
              </div>
            )}
          </div>
        </GlowCard>

        {/* Streak — top-right col 3 */}
        <GlowCard>
          <div className="p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <i className="bi bi-fire text-accent" />
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{t('dashboard.streak')}</p>
              </div>
              <p className="text-4xl font-bold text-accent tracking-tight">
                {streak?.current_streak ?? 0}<span className="text-sm text-neutral-500 ml-0.5 font-normal">{t('common.days')}</span>
              </p>
            </div>
            {streak?.longest_streak ? (
              <p className="text-[10px] font-medium text-neutral-600">
                {t('dashboard.best')} <span className="text-white font-bold">{streak.longest_streak}{t('common.days')}</span>
              </p>
            ) : null}
          </div>
        </GlowCard>

        {/* Total — top-right col 4 */}
        <GlowCard>
          <div className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center gap-2 mb-1">
              <i className="bi bi-check2-circle text-neutral-500" />
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{t('dashboard.total')}</p>
            </div>
            <p className="text-4xl font-bold text-white tracking-tight">{streak?.total_workouts ?? 0}</p>
          </div>
        </GlowCard>

        {/* Minutos — bottom-right col 3 */}
        <GlowCard>
          <div className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center gap-2 mb-1">
              <i className="bi bi-clock text-neutral-500" />
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{t('dashboard.minutes')}</p>
            </div>
            <p className="text-4xl font-bold text-white tracking-tight">{streak?.total_minutes ?? 0}</p>
          </div>
        </GlowCard>

        {/* Semana — bottom-right col 4 */}
        <GlowCard>
          <div className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center gap-2 mb-1">
              <i className="bi bi-calendar-week text-neutral-500" />
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{t('dashboard.week')}</p>
            </div>
            <p className="text-4xl font-bold text-white tracking-tight">{weekSessions}</p>
          </div>
        </GlowCard>
      </div>

      {/* ── Routines ── */}
      <section>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight">{t('dashboard.myRoutines')}</h2>
          <Link to="/routines" className="text-[11px] text-neutral-900 font-bold uppercase tracking-wider hover:text-accent transition-colors">
            {t('dashboard.seeAll')} <i className="bi bi-arrow-right" />
          </Link>
        </div>

        {recentRoutines.length === 0 ? (
          <div className="card border-dashed p-12 text-center">
            <i className="bi bi-journal-plus text-3xl text-neutral-300 mb-3 block" />
            <p className="text-neutral-400 text-sm font-medium">{t('dashboard.noRoutines')}</p>
            <Link to="/routines/new" className="mt-4 inline-block btn-primary text-[11px]">
              {t('dashboard.createFirst')} <i className="bi bi-arrow-right ml-1" />
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentRoutines.map(r => (
              <GlowCard key={r.id}>
                <div className="p-5 flex flex-col flex-1 gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-black text-white truncate text-[15px] leading-tight">{r.name}</h3>
                    <DifficultyDots level={r.difficulty} />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {r.goal && (
                      <span className="text-[10px] font-bold text-accent uppercase tracking-wider bg-accent/10 px-2.5 py-1 rounded-full">
                        {GOAL_LABELS[r.goal] ?? r.goal}
                      </span>
                    )}
                    {r.estimated_duration_min && (
                      <span className="text-[10px] font-semibold text-neutral-500 bg-white/5 px-2.5 py-1 rounded-full">
                        {r.estimated_duration_min} min
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">
                    {r.exercise_count !== undefined && (
                      <span className="flex items-center gap-1">
                        <i className="bi bi-list-check text-accent/60" /><strong className="text-accent">{r.exercise_count}</strong> {t('common.exercises')}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <i className="bi bi-arrow-repeat text-accent/60" /><strong className="text-accent">{r.times_completed}</strong>{t('dashboard.timesCompleted')}
                    </span>
                  </div>

                  {r.description && (
                    <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed italic">{r.description}</p>
                  )}

                  <button
                    onClick={() => navigate(`/session/${r.id}`)}
                    className="w-full btn-primary py-2.5 mt-auto"
                  >
                    {t('dashboard.startWorkout')}
                  </button>
                </div>
              </GlowCard>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
