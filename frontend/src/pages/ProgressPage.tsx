import { useEffect, useState, useRef, useCallback } from 'react'
import { cap } from '../lib/utils'
import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { progressService } from '../services/progressService'
import { useAsync } from '../hooks/useAsync'
import GlowCard from '../components/ui/GlowCard'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import PageHeader from '../components/ui/PageHeader'
import { CHART_THEME, AXIS_PROPS } from '../lib/chartTheme'
import { translateMuscle } from '../utils/labels'
import ErrorState from '../components/ui/ErrorState'

const PERIODS = [
  { label: '7d',  value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
]

const RECORD_UNITS: Record<string, string> = {
  max_weight: 'kg', max_reps: 'reps', max_duration: 's',
}

function EmptyChart() {
  const { t } = useTranslation()
  return (
    <EmptyState
      bare
      icon="bi-graph-up"
      title={t('progress.noChartData')}
      description={t('progress.noChartHint')}
      className="py-6"
    />
  )
}

export default function ProgressPage() {
  const { t } = useTranslation()
  const [days, setDays]               = useState(30)
  const [visualDays, setVisualDays]   = useState(30)
  const deferRef = useRef<ReturnType<typeof setTimeout>>(null)
  const [selectedExId, setSelectedExId] = useState<number | null>(null)

  const handlePeriodChange = useCallback((value: number) => {
    setVisualDays(value)
    if (deferRef.current) clearTimeout(deferRef.current)
    deferRef.current = setTimeout(() => setDays(value), 350)
  }, [])

  useEffect(() => () => { if (deferRef.current) clearTimeout(deferRef.current) }, [])

  const chartsQ    = useAsync(() => progressService.getCharts(days), [days])
  const exercisesQ = useAsync(() => progressService.getTrainedExercises(), [])
  const recordsQ   = useAsync(() => progressService.getRecords(), [])
  const statsQ     = useAsync(() => progressService.getStats(), [])

  const charts    = chartsQ.data
  const exercises = exercisesQ.data ?? []
  const records   = recordsQ.data ?? []
  const streak    = statsQ.data?.streak ?? null
  const badges    = statsQ.data?.badges ?? []

  // Ejercicio seleccionado: el elegido por el usuario o, por defecto, el primero entrenado
  const selectedEx = selectedExId ?? exercises[0]?.id ?? null

  const progressionQ = useAsync(async () => {
    if (selectedEx === null) return { progression: [], oneRM: [] }
    const [progression, oneRM] = await Promise.all([
      progressService.getExerciseProgression(selectedEx),
      progressService.get1RMProgression(selectedEx),
    ])
    return { progression, oneRM }
  }, [selectedEx])
  const progression = progressionQ.data?.progression ?? []
  const oneRMData   = progressionQ.data?.oneRM ?? []

  const baseError = exercisesQ.error || recordsQ.error || statsQ.error
  const retryBase = () => {
    if (exercisesQ.error) exercisesQ.reload()
    if (recordsQ.error) recordsQ.reload()
    if (statsQ.error) statsQ.reload()
  }

  const RECORD_LABELS: Record<string, string> = {
    max_weight: t('progress.maxWeight'), max_reps: t('progress.maxReps'), max_duration: t('progress.maxDuration'),
  }

  const handleExerciseChange = (id: number) => setSelectedExId(id)

  return (
    <div className="space-y-10">
      <PageHeader
        title={t('progress.title')}
        subtitle={t('progress.subtitle')}
        actions={
          <div role="group" aria-label={t('progress.subtitle')} className="flex gap-1 rounded-full border border-white/10 bg-white/5 p-1">
            {PERIODS.map(p => (
              <button
                key={p.value}
                type="button"
                aria-pressed={visualDays === p.value}
                onClick={() => handlePeriodChange(p.value)}
                className={`min-h-[44px] min-w-[52px] rounded-full px-4 text-xs font-bold tabular-nums transition-colors duration-200 ${
                  visualDays === p.value ? 'bg-accent text-neutral-900' : 'text-neutral-300 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {!!baseError && <ErrorState message={t('common.loadError')} onRetry={retryBase} />}

      {streak && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('progress.currentStreak'), value: `${streak.current_streak}d` },
            { label: t('progress.bestStreak'),    value: `${streak.longest_streak}d` },
            { label: t('progress.workouts'),      value: streak.total_workouts },
            { label: t('progress.totalMinutes'),  value: streak.total_minutes },
          ].map(({ label, value }) => (
            <GlowCard key={label}>
              <div className="p-4 text-center">
                <p className="text-3xl font-black tabular-nums text-white">{value}</p>
                <p className="text-xs font-medium text-neutral-400 mt-1">{label}</p>
              </div>
            </GlowCard>
          ))}
        </div>
      )}

      {badges.length > 0 && (
        <section>
          <h2 className="section-title">{t('progress.achievements')}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {badges.map(b => (
              <GlowCard key={b.id}>
                <div
                  title={b.description}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 text-center transition-all min-h-[80px] ${
                    b.earned ? '' : 'opacity-40 grayscale'
                  }`}
                >
                  <i className={`bi bi-trophy text-2xl ${b.earned ? 'text-accent' : 'text-neutral-400'}`} />
                  <p className={`text-xs font-bold leading-tight uppercase tracking-wider ${b.earned ? 'text-white' : 'text-neutral-400'}`}>{b.label}</p>
                </div>
              </GlowCard>
            ))}
          </div>
        </section>
      )}

      {chartsQ.loading ? (
        <div role="status" aria-busy="true" className="space-y-6">
          <span className="sr-only">{t('common.loading')}</span>
          <Skeleton className="h-60 rounded-apple" />
          <Skeleton className="h-60 rounded-apple" />
        </div>
      ) : chartsQ.error ? (
        <ErrorState message={t('common.loadError')} onRetry={chartsQ.reload} />
      ) : charts && (
        <>
          <section>
            <h2 className="section-title">{t('progress.completedSessions')}</h2>
            <GlowCard>
              <div className="p-5">
                {charts.frequency.length === 0 ? <EmptyChart /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={charts.frequency} barSize={12}>
                      <CartesianGrid strokeDasharray={CHART_THEME.gridDash} stroke={CHART_THEME.grid} />
                      <XAxis dataKey="date" {...AXIS_PROPS} tickFormatter={d => d.slice(5)} />
                      <YAxis allowDecimals={false} {...AXIS_PROPS} />
                      <Tooltip contentStyle={CHART_THEME.tooltip} labelFormatter={d => d} formatter={(v) => [String(v ?? 0), cap(t('common.sessions'))]} />
                      <Bar dataKey="sessions" fill={CHART_THEME.accent} radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </GlowCard>
          </section>

          <section>
            <h2 className="section-title">{t('progress.totalVolume')}</h2>
            <GlowCard>
              <div className="p-5">
                {charts.volume.length === 0 ? <EmptyChart /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={charts.volume}>
                      <CartesianGrid strokeDasharray={CHART_THEME.gridDash} stroke={CHART_THEME.grid} />
                      <XAxis dataKey="date" {...AXIS_PROPS} tickFormatter={d => d.slice(5)} />
                      <YAxis {...AXIS_PROPS} />
                      <Tooltip contentStyle={CHART_THEME.tooltip} labelFormatter={d => d} formatter={(v) => [`${v} kg`, t('progress.volume')]} />
                      <Line type="monotone" dataKey="volume_kg" stroke={CHART_THEME.accent} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </GlowCard>
          </section>

          <section>
            <h2 className="section-title">{t('progress.sessionDuration')}</h2>
            <GlowCard>
              <div className="p-5">
                {charts.duration.length === 0 ? <EmptyChart /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={charts.duration}>
                      <defs>
                        <linearGradient id="durationGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={CHART_THEME.accent} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CHART_THEME.accent} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray={CHART_THEME.gridDash} stroke={CHART_THEME.grid} />
                      <XAxis dataKey="date" {...AXIS_PROPS} tickFormatter={d => d.slice(5)} />
                      <YAxis {...AXIS_PROPS} />
                      <Tooltip contentStyle={CHART_THEME.tooltip} labelFormatter={d => d} formatter={(v) => [`${v} min`, t('progress.duration')]} />
                      <Area type="monotone" dataKey="duration_min" stroke={CHART_THEME.accent} strokeWidth={2} fill="url(#durationGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </GlowCard>
          </section>

          <section>
            <h2 className="section-title">{t('progress.muscleDistribution')}</h2>
            <GlowCard>
              <div className="p-5">
                {charts.muscles.length === 0 ? <EmptyChart /> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={charts.muscles.map(m => ({ ...m, muscle_label: translateMuscle(m.muscle_group) }))}>
                      <PolarGrid stroke={CHART_THEME.polarGrid} />
                      <PolarAngleAxis dataKey="muscle_label" tick={CHART_THEME.tick} />
                      <Radar dataKey="sets" stroke={CHART_THEME.accent} fill={CHART_THEME.accent} fillOpacity={0.25} />
                      <Tooltip contentStyle={CHART_THEME.tooltip} formatter={(v) => [String(v ?? 0), cap(t('common.sets'))]} />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </GlowCard>
          </section>
        </>
      )}

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="section-title mb-0">{t('progress.exerciseProgression')}</h2>
          <select
            aria-label={t('progress.exerciseProgression')}
            value={selectedEx ?? ''}
            onChange={e => handleExerciseChange(Number(e.target.value))}
            className="form-input min-h-[44px] !w-full sm:!w-auto"
          >
            {exercises.length === 0 && <option value="">{t('common.noData')}</option>}
            {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
          </select>
        </div>
        {!!progressionQ.error && <ErrorState message={t('common.loadError')} onRetry={progressionQ.reload} />}
        <GlowCard>
          <div className="p-5">
            {progression.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={progression}>
                  <CartesianGrid strokeDasharray={CHART_THEME.gridDash} stroke={CHART_THEME.grid} />
                  <XAxis dataKey="date" {...AXIS_PROPS} tickFormatter={d => d.slice(5)} />
                  <YAxis {...AXIS_PROPS} />
                  <Tooltip contentStyle={CHART_THEME.tooltip} labelFormatter={d => d} formatter={(v) => [`${v} kg`, t('progress.maxWeight')]} />
                  <Line type="monotone" dataKey="value" stroke={CHART_THEME.line} strokeWidth={2} dot={{ r: 2, fill: CHART_THEME.accent }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlowCard>
      </section>

      <section>
        <h2 className="section-title">{t('progress.projection1RM')}</h2>
        <p className="text-xs text-neutral-400 mb-3">{t('progress.projection1RMDesc')}</p>
        <GlowCard>
          <div className="p-5">
            {oneRMData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={oneRMData}>
                  <CartesianGrid strokeDasharray={CHART_THEME.gridDash} stroke={CHART_THEME.grid} />
                  <XAxis dataKey="date" {...AXIS_PROPS} tickFormatter={d => d.slice(5)} />
                  <YAxis {...AXIS_PROPS} />
                  <Tooltip contentStyle={CHART_THEME.tooltip} labelFormatter={d => d} formatter={(v) => [`${v} kg`, t('progress.estimated1RM')]} />
                  <Line type="monotone" dataKey="value" stroke={CHART_THEME.accent} strokeWidth={2.5} dot={{ r: 3, fill: CHART_THEME.accent, stroke: CHART_THEME.dotStroke, strokeWidth: 1 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlowCard>
      </section>

      <section>
        <h2 className="section-title">{t('progress.personalRecords')}</h2>
        {records.length === 0 ? (
          <EmptyState icon="bi-trophy" title={t('progress.noRecords')} />
        ) : (
          <GlowCard>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.03] text-xs font-medium text-neutral-400">
                  <tr>
                    <th className="text-left px-4 py-3">{t('progress.exercise')}</th>
                    <th className="text-left px-4 py-3">{t('progress.type')}</th>
                    <th className="text-right px-4 py-3">{t('progress.value')}</th>
                    <th className="text-right px-4 py-3">{t('progress.date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {records.map(pr => (
                    <tr key={pr.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-bold text-white">{pr.exercise_name}</td>
                      <td className="px-4 py-3 text-neutral-400 text-xs font-medium">{RECORD_LABELS[pr.record_type]}</td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-accent">
                        {pr.value} {RECORD_UNITS[pr.record_type]}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-xs tabular-nums text-neutral-400">
                        {new Date(pr.achieved_at).toLocaleDateString('es-ES')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlowCard>
        )}
      </section>
    </div>
  )
}
