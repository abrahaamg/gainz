import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { routineService } from '../services/routineService'
import { progressService } from '../services/progressService'
import { useAsync } from '../hooks/useAsync'
import type { Routine } from '../types/routine'
import { label } from '../utils/labels'
import { CHART_THEME, AXIS_PROPS } from '../lib/chartTheme'
import DifficultyDots from '../components/ui/DifficultyDots'
import AnimatedHero from '../components/ui/AnimatedHero'
import GlowCard from '../components/ui/GlowCard'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Skeleton from '../components/ui/Skeleton'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

// Siguiente entrenamiento: la rutina que menos veces se ha completado (a igualdad, la editada más recientemente)
function pickNextRoutine(routines: Routine[]): Routine | undefined {
  return [...routines].sort((a, b) =>
    a.times_completed - b.times_completed ||
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  )[0]
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-6">
      <Skeleton className="h-24 sm:h-56 rounded-apple" />
      <Skeleton className="h-44 rounded-apple" />
      <Skeleton className="h-20 rounded-apple" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-40 rounded-apple" />
        <Skeleton className="h-40 rounded-apple" />
        <Skeleton className="hidden h-40 rounded-apple lg:block" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { data, loading, error, reload } = useAsync(async () => {
    const [routines, stats, charts] = await Promise.all([
      routineService.getAll(),
      progressService.getStats(),
      progressService.getCharts(30),
    ])
    return { routines, streak: stats.streak, frequency: charts.frequency }
  }, [])

  if (loading) return <DashboardSkeleton />

  if (error || !data) {
    return (
      <div className="space-y-6">
        <AnimatedHero />
        <ErrorState message={t('dashboard.loadError')} onRetry={reload} />
      </div>
    )
  }

  const { routines, streak, frequency } = data

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 6)
  weekStart.setHours(0, 0, 0, 0)
  const weekSessions = frequency
    .filter(f => new Date(f.date) >= weekStart)
    .reduce((acc, f) => acc + f.sessions, 0)

  const recentRoutines = [...routines]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 6)

  const next = pickNextRoutine(routines)

  const kpis = [
    { icon: 'bi-fire', accent: true, label: t('dashboard.streak'), value: streak.current_streak, unit: t('common.days') },
    { icon: 'bi-check2-circle', accent: false, label: t('dashboard.total'), value: streak.total_workouts },
    { icon: 'bi-clock', accent: false, label: t('dashboard.minutes'), value: streak.total_minutes },
    { icon: 'bi-calendar-week', accent: false, label: t('dashboard.week'), value: weekSessions },
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      <AnimatedHero />

      {/* ── Siguiente entrenamiento (única tarjeta con glow de la pantalla) ── */}
      {next ? (
        <GlowCard glow>
          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-neutral-400">{t('dashboard.nextWorkout')}</p>
                <h2 className="mt-1 truncate text-2xl font-black tracking-tight text-white">{next.name}</h2>
              </div>
              <DifficultyDots level={next.difficulty} />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              {next.goal && (
                <span className="rounded-full bg-accent/10 px-2.5 py-1 text-accent">{label('goals', next.goal)}</span>
              )}
              {next.estimated_duration_min && (
                <span className="rounded-full bg-white/5 px-2.5 py-1 tabular-nums text-neutral-300">{next.estimated_duration_min} min</span>
              )}
              {next.exercise_count !== undefined && (
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-neutral-300">
                  {t('dashboard.exercisesCount', { count: next.exercise_count })}
                </span>
              )}
            </div>

            <button
              onClick={() => navigate(`/session/${next.id}`)}
              className="btn-primary h-14 w-full text-sm"
            >
              <i aria-hidden="true" className="bi bi-play-fill mr-1 text-lg" />
              {t('dashboard.startWorkout')}
            </button>
          </div>
        </GlowCard>
      ) : (
        <EmptyState
          icon="bi-journal-plus"
          title={t('dashboard.noRoutines')}
          description={t('dashboard.noRoutinesHint')}
          action={
            <Link to="/routines/new" className="btn-primary">
              {t('dashboard.createFirst')}
            </Link>
          }
        />
      )}

      {/* ── KPIs compactos ── */}
      <GlowCard>
        <dl className="grid grid-cols-4 divide-x divide-white/[0.06]">
          {kpis.map(k => (
            <div key={k.label} className="flex flex-col gap-1 px-2 py-4 text-center sm:px-5">
              <dt className="order-2 text-xs font-medium text-neutral-400">{k.label}</dt>
              <dd className={`order-1 text-2xl font-bold tabular-nums tracking-tight sm:text-3xl ${k.accent ? 'text-accent' : 'text-white'}`}>
                {k.value}
                {k.unit && <span className="ml-0.5 text-xs font-normal text-neutral-400">{k.unit}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </GlowCard>

      {/* ── Rutinas ── */}
      {recentRoutines.length > 0 && (
        <section aria-labelledby="dash-routines">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="dash-routines" className="text-lg font-bold tracking-tight text-neutral-900">{t('dashboard.myRoutines')}</h2>
            <Link to="/routines" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-neutral-900 transition-colors hover:text-accent-text dark:hover:text-accent">
              {t('dashboard.seeAll')} <i aria-hidden="true" className="bi bi-arrow-right ml-1" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentRoutines.map(r => (
              <GlowCard key={r.id}>
                <div className="flex h-full flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-base font-bold leading-tight text-white">{r.name}</h3>
                    <DifficultyDots level={r.difficulty} />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                    {r.goal && (
                      <span className="rounded-full bg-accent/10 px-2.5 py-1 text-accent">{label('goals', r.goal)}</span>
                    )}
                    {r.estimated_duration_min && (
                      <span className="rounded-full bg-white/5 px-2.5 py-1 tabular-nums text-neutral-300">{r.estimated_duration_min} min</span>
                    )}
                  </div>

                  <p className="flex items-center gap-4 text-xs font-medium text-neutral-400">
                    {r.exercise_count !== undefined && (
                      <span className="flex items-center gap-1">
                        <i aria-hidden="true" className="bi bi-list-check text-accent/60" />
                        <strong className="tabular-nums text-accent">{r.exercise_count}</strong> {t('common.exercises')}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <i aria-hidden="true" className="bi bi-arrow-repeat text-accent/60" />
                      <strong className="tabular-nums text-accent">{r.times_completed}</strong>{t('dashboard.timesCompleted')}
                    </span>
                  </p>

                  {r.description && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-neutral-400">{r.description}</p>
                  )}

                  <button
                    onClick={() => navigate(`/session/${r.id}`)}
                    className="btn-ghost-dark mt-auto w-full"
                  >
                    {t('dashboard.startWorkout')}
                  </button>
                </div>
              </GlowCard>
            ))}
          </div>
        </section>
      )}

      {/* ── Actividad (después de las rutinas) ── */}
      <section aria-labelledby="dash-activity">
        <h2 id="dash-activity" className="section-title">{t('dashboard.activity30d')}</h2>
        <GlowCard>
          <div className="p-5">
            {frequency.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={frequency} barSize={6}>
                    <CartesianGrid strokeDasharray={CHART_THEME.gridDash} stroke={CHART_THEME.grid} vertical={false} />
                    <XAxis dataKey="date" {...AXIS_PROPS} tickFormatter={d => d.slice(5)} />
                    <YAxis allowDecimals={false} width={24} {...AXIS_PROPS} />
                    <Tooltip
                      labelFormatter={d => d}
                      formatter={(v) => [String(v ?? 0), t('common.sessions')]}
                      contentStyle={CHART_THEME.tooltip}
                    />
                    <Bar dataKey="sessions" fill={CHART_THEME.accent} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                bare
                icon="bi-bar-chart"
                title={t('dashboard.noSessions')}
                description={t('dashboard.completeWorkout')}
              />
            )}
          </div>
        </GlowCard>
      </section>
    </div>
  )
}
