import { useEffect, useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
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
import GlowCard from '../components/ui/GlowCard'

const PERIODS = [
  { label: '7d',  value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
]

const RECORD_UNITS: Record<string, string> = {
  max_weight: 'kg', max_reps: 'reps', max_duration: 's',
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-32 text-neutral-300 text-[11px] font-semibold uppercase tracking-wider">
      {label}
    </div>
  )
}

export default function ProgressPage() {
  const { t } = useTranslation()
  const [days, setDays]               = useState(30)
  const [visualDays, setVisualDays]   = useState(30)
  const deferRef = useRef<ReturnType<typeof setTimeout>>(null)
  const [charts, setCharts]           = useState<ChartsData | null>(null)
  const [exercises, setExercises]     = useState<ExerciseOption[]>([])
  const [selectedEx, setSelectedEx]   = useState<number | null>(null)
  const [progression, setProgression] = useState<ProgressionPoint[]>([])
  const [records, setRecords]         = useState<PersonalRecord[]>([])
  const [streak, setStreak]           = useState<StreakStats | null>(null)
  const [badges, setBadges]           = useState<Badge[]>([])
  const [oneRMData, setOneRMData]         = useState<ProgressionPoint[]>([])
  const [loadingCharts, setLoadingCharts] = useState(true)

  const handlePeriodChange = useCallback((value: number) => {
    setVisualDays(value)
    if (deferRef.current) clearTimeout(deferRef.current)
    deferRef.current = setTimeout(() => setDays(value), 350)
  }, [])

  useEffect(() => {
    setLoadingCharts(true)
    progressService.getCharts(days).then(setCharts).finally(() => setLoadingCharts(false))
  }, [days])

  useEffect(() => {
    progressService.getTrainedExercises().then(exs => {
      setExercises(exs)
      if (exs.length) {
        setSelectedEx(exs[0].id)
        progressService.getExerciseProgression(exs[0].id).then(setProgression)
        progressService.get1RMProgression(exs[0].id).then(setOneRMData)
      }
    })
    progressService.getRecords().then(setRecords)
    progressService.getStats().then(({ streak: s, badges: b }) => { setStreak(s); setBadges(b) })
  }, [])

  const RECORD_LABELS: Record<string, string> = {
    max_weight: t('progress.maxWeight'), max_reps: t('progress.maxReps'), max_duration: t('progress.maxDuration'),
  }

  const handleExerciseChange = (id: number) => {
    setSelectedEx(id)
    progressService.getExerciseProgression(id).then(setProgression)
    progressService.get1RMProgression(id).then(setOneRMData)
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
      <div className="card header-gradient px-8 py-8 mb-8 flex items-center justify-between border-none">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t('progress.title')}</h1>
          <p className="text-neutral-500 text-xs mt-1">{t('progress.subtitle')}</p>
        </div>
        <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-full relative">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => handlePeriodChange(p.value)}
              className="relative px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full z-10 transition-colors duration-200"
              style={{ color: visualDays === p.value ? '#0a0a0a' : '#a3a3a3' }}
            >
              {visualDays === p.value && (
                <motion.div
                  layoutId="period-indicator"
                  className="absolute inset-0 bg-accent rounded-full shadow-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

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
                <p className="text-3xl font-black text-white">{value}</p>
                <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mt-1">{label}</p>
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
                  <i className={`bi bi-trophy text-2xl ${b.earned ? 'text-accent' : 'text-neutral-500'}`} />
                  <p className={`text-[10px] font-bold leading-tight uppercase tracking-wider ${b.earned ? 'text-white' : 'text-neutral-400'}`}>{b.label}</p>
                </div>
              </GlowCard>
            ))}
          </div>
        </section>
      )}

      {loadingCharts ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : charts && (
        <>
          <section>
            <h2 className="section-title">{t('progress.completedSessions')}</h2>
            <GlowCard>
              <div className="p-5">
                {charts.frequency.length === 0 ? <EmptyChart label={t('common.noData')} /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={charts.frequency} barSize={12}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#737373' }} tickFormatter={d => d.slice(5)} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#737373' }} />
                      <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', fontSize: 12, color: '#fff' }} labelFormatter={d => d} formatter={(v: number) => [v, t('common.sessions')]} />
                      <Bar dataKey="sessions" fill="#F5C400" radius={[2, 2, 0, 0]} />
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
                {charts.volume.length === 0 ? <EmptyChart label={t('common.noData')} /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={charts.volume}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#737373' }} tickFormatter={d => d.slice(5)} />
                      <YAxis tick={{ fontSize: 10, fill: '#737373' }} />
                      <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', fontSize: 12, color: '#fff' }} labelFormatter={d => d} formatter={(v: number) => [`${v} kg`, t('progress.volume')]} />
                      <Line type="monotone" dataKey="volume_kg" stroke="#F5C400" strokeWidth={2} dot={false} />
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
                {charts.duration.length === 0 ? <EmptyChart label={t('common.noData')} /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={charts.duration}>
                      <defs>
                        <linearGradient id="durationGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#F5C400" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#F5C400" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#737373' }} tickFormatter={d => d.slice(5)} />
                      <YAxis tick={{ fontSize: 10, fill: '#737373' }} />
                      <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', fontSize: 12, color: '#fff' }} labelFormatter={d => d} formatter={(v: number) => [`${v} min`, t('progress.duration')]} />
                      <Area type="monotone" dataKey="duration_min" stroke="#F5C400" strokeWidth={2} fill="url(#durationGrad)" />
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
                {charts.muscles.length === 0 ? <EmptyChart label={t('common.noData')} /> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={charts.muscles}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="muscle_group" tick={{ fontSize: 10, fill: '#a3a3a3' }} />
                      <Radar dataKey="sets" stroke="#F5C400" fill="#F5C400" fillOpacity={0.25} />
                      <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', fontSize: 12, color: '#fff' }} formatter={(v: number) => [v, t('common.sets')]} />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </GlowCard>
          </section>
        </>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">{t('progress.exerciseProgression')}</h2>
          <select
            value={selectedEx ?? ''}
            onChange={e => handleExerciseChange(Number(e.target.value))}
            className="border border-neutral-300 shadow-input px-4 py-2 text-[11px] font-bold bg-white text-neutral-900 uppercase tracking-wider rounded-full"
          >
            {exercises.length === 0 && <option value="">{t('common.noData')}</option>}
            {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
          </select>
        </div>
        <GlowCard>
          <div className="p-5">
            {progression.length === 0 ? <EmptyChart label={t('common.noData')} /> : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={progression}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#737373' }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: '#737373' }} />
                  <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', fontSize: 12, color: '#fff' }} labelFormatter={d => d} formatter={(v: number) => [`${v} kg`, t('progress.maxWeight')]} />
                  <Line type="monotone" dataKey="value" stroke="#fff" strokeWidth={2} dot={{ r: 2, fill: '#F5C400' }} />
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
            {oneRMData.length === 0 ? <EmptyChart label={t('common.noData')} /> : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={oneRMData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#737373' }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: '#737373' }} />
                  <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', fontSize: 12, color: '#fff' }} labelFormatter={d => d} formatter={(v: number) => [`${v} kg`, t('progress.estimated1RM')]} />
                  <Line type="monotone" dataKey="value" stroke="#F5C400" strokeWidth={2.5} dot={{ r: 3, fill: '#F5C400', stroke: '#222', strokeWidth: 1 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlowCard>
      </section>

      <section>
        <h2 className="section-title">{t('progress.personalRecords')}</h2>
        {records.length === 0 ? (
          <div className="text-center py-10 text-neutral-300 text-[11px] font-semibold uppercase tracking-wider">{t('progress.noRecords')}</div>
        ) : (
          <GlowCard>
            <div className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="text-[11px] text-neutral-500 font-bold uppercase tracking-widest" style={{ background: 'rgba(255,255,255,0.03)' }}>
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
                      <td className="px-4 py-3 font-black text-white">{pr.exercise_name}</td>
                      <td className="px-4 py-3 text-neutral-500 text-[11px] font-semibold uppercase tracking-wider">{RECORD_LABELS[pr.record_type]}</td>
                      <td className="px-4 py-3 text-right font-black text-accent">
                        {pr.value} {RECORD_UNITS[pr.record_type]}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-500 text-xs">
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
