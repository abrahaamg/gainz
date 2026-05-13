import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { sessionService } from '../services/sessionService'
import { Session } from '../types/session'
import GlowCard from '../components/ui/GlowCard'

function fmtTime(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtHour(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'text-green-400',
  abandoned: 'text-red-400',
  in_progress: 'text-accent',
}

type FilterStatus = '' | 'completed' | 'abandoned' | 'in_progress'

export default function HistoryPage() {
  const { t } = useTranslation()

  const STATUS_LABELS: Record<string, string> = {
    completed: t('history.completedLabel'),
    abandoned: t('history.abandonedLabel'),
    in_progress: t('history.inProgressLabel'),
  }

  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<FilterStatus>('')
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    sessionService.getByUser(100)
      .then(setSessions)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter
    ? sessions.filter(s => s.status === filter)
    : sessions

  // Stats resumen
  const completedSessions = sessions.filter(s => s.status === 'completed')
  const totalMinutes = completedSessions.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0) / 60
  const totalCalories = completedSessions.reduce((sum, s) => sum + (s.calories_burned ?? 0), 0)
  const avgRating = completedSessions.length
    ? (completedSessions.reduce((sum, s) => sum + (s.rating ?? 0), 0) / completedSessions.filter(s => s.rating).length).toFixed(1)
    : '—'

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="card header-gradient px-8 py-8 mb-8 flex items-center justify-between border-none">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t('history.title')}</h1>
          <p className="text-neutral-500 text-xs mt-1">{sessions.length} {t('history.sessionsRegistered')}</p>
        </div>
      </div>

      {/* Stats resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: t('common.sessions'), value: completedSessions.length },
          { label: t('history.minutes'), value: Math.round(totalMinutes) },
          { label: t('history.calories'), value: totalCalories.toLocaleString() },
          { label: t('history.avgRating'), value: avgRating },
        ].map(({ label, value }) => (
          <GlowCard key={label}>
            <div className="p-4 text-center">
              <p className="text-2xl font-black text-white">{value}</p>
              <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mt-1">{label}</p>
            </div>
          </GlowCard>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {([
          { value: '', label: t('common.all') },
          { value: 'completed', label: t('history.completed') },
          { value: 'in_progress', label: t('history.inProgress') },
          { value: 'abandoned', label: t('history.abandoned') },
        ] as { value: FilterStatus; label: string }[]).map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`chip ${filter === f.value ? 'chip-active' : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <i className="bi bi-journal-x text-3xl text-neutral-600 mb-3 block" />
          <p className="text-neutral-500 text-sm font-medium">{t('history.noSessions')}</p>
          <Link to="/routines" className="mt-4 inline-block text-[11px] font-black uppercase tracking-wider text-accent hover:text-white transition-colors">
            {t('history.goToRoutines')} <i className="bi bi-arrow-right" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(session => {
            const isExpanded = expanded === session.id
            return (
              <GlowCard key={session.id}>
                {/* Header clickable */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : session.id)}
                  className="w-full px-5 py-4 text-left"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="font-black text-white truncate">
                          {session.routine_name ?? t('history.freeSession')}
                        </h2>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[session.status]}`}>
                          {STATUS_LABELS[session.status]}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                        <span>{fmtDate(session.started_at)}</span>
                        <span>{fmtHour(session.started_at)}</span>
                        {session.duration_seconds && <span>{fmtTime(session.duration_seconds)}</span>}
                        {session.calories_burned && <span>{session.calories_burned} kcal</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Rating stars */}
                      {session.rating && (
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <i key={s} className={`bi bi-star-fill text-xs ${s <= session.rating! ? 'text-accent' : 'text-neutral-700'}`} />
                          ))}
                        </div>
                      )}
                      <i className={`bi bi-chevron-down text-neutral-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </button>

                {/* Expandido: notas + link al resumen */}
                <div className={`dropdown-panel ${isExpanded ? 'open' : ''}`}>
                  <div>
                    <div className="border-t border-white/10 px-5 py-4 space-y-3">
                      {session.notes ? (
                        <div className="bg-white/5 px-4 py-3 rounded-xl">
                          <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                            <i className="bi bi-pencil-square mr-1" />{t('history.notes')}
                          </p>
                          <p className="text-sm text-neutral-300 leading-relaxed">{session.notes}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-600 italic">{t('history.noNotes')}</p>
                      )}

                      <div className="flex gap-3">
                        <Link
                          to={`/session/${session.id}/summary`}
                          className="btn-primary py-1.5 px-4"
                        >
                          {t('history.viewSummary')}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </GlowCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
