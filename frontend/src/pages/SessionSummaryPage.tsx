import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { sessionService } from '../services/sessionService'
import { Session, SessionExercise } from '../types/session'
import GlowCard from '../components/ui/GlowCard'

function fmtTime(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s}s`
}

export default function SessionSummaryPage() {
  const { t } = useTranslation()
  const { routineId } = useParams<{ routineId: string }>()
  const [session, setSession]     = useState<Session | null>(null)
  const [exercises, setExercises] = useState<SessionExercise[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    sessionService.getById(Number(routineId))
      .then(s => {
        setSession(s)
        setExercises(s.exercises ?? [])
      })
      .finally(() => setLoading(false))
  }, [routineId])

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!session) return (
    <div className="text-center py-16 text-red-500 font-medium">{t('session.notFound')}</div>
  )

  const completedSets = exercises.filter(e => e.completed)
  const totalSets     = completedSets.length
  const totalVolume = completedSets.reduce((sum, e) => {
    if (e.reps_done && e.weight_kg) return sum + e.reps_done * e.weight_kg
    return sum
  }, 0)

  const byExercise = completedSets.reduce<Record<number, { name: string; sets: SessionExercise[] }>>(
    (acc, ex) => {
      const key = ex.exercise_id
      if (!acc[key]) acc[key] = { name: ex.exercise_name ?? t('session.exerciseFallback', { index: key }), sets: [] }
      acc[key].sets.push(ex)
      return acc
    },
    {}
  )

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <i className="bi bi-trophy text-5xl text-accent mb-3 block" />
        <h1 className="page-title">{t('session.completed')}</h1>
        {session.routine_name && (
          <p className="page-subtitle">{session.routine_name}</p>
        )}
        {session.rating && (
          <div className="flex justify-center gap-1 mt-3">
            {[1, 2, 3, 4, 5].map(s => (
              <i key={s} className={`bi bi-star-fill text-lg ${s <= session.rating! ? 'text-accent' : 'text-neutral-200'}`} />
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <GlowCard>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-accent">
              {session.duration_seconds ? fmtTime(session.duration_seconds) : '—'}
            </p>
            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mt-1">{t('session.duration')}</p>
          </div>
        </GlowCard>
        <GlowCard>
          <div className="p-4 text-center">
            <p className="text-2xl font-black text-white">{totalSets}</p>
            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mt-1">{t('common.sets')}</p>
          </div>
        </GlowCard>
        <GlowCard>
          <div className="p-4 text-center">
            <p className="text-2xl font-black text-white">
              {totalVolume > 0 ? `${Math.round(totalVolume).toLocaleString()}` : '—'}
            </p>
            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mt-1">{t('session.volume')}</p>
          </div>
        </GlowCard>
        <GlowCard>
          <div className="p-4 text-center">
            <p className="text-2xl font-black text-white">{session.calories_burned ?? '—'}</p>
            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mt-1">{t('session.calories')}</p>
          </div>
        </GlowCard>
      </div>

      {/* Notes */}
      {session.notes && (
        <div className="bg-accent/5 border border-accent/10 px-5 py-4 mb-6 rounded-2xl">
          <p className="section-title mb-1">
            <i className="bi bi-pencil-square mr-1" />{t('session.notes')}
          </p>
          <p className="text-sm text-neutral-600">{session.notes}</p>
        </div>
      )}

      {/* Exercise breakdown */}
      {Object.keys(byExercise).length > 0 && (
        <div className="mb-8">
          <h2 className="section-title">{t('session.breakdown')}</h2>
          <div className="space-y-2">
            {Object.values(byExercise).map(({ name, sets }) => {
              const maxWeight = Math.max(...sets.map(s => s.weight_kg ?? 0))
              return (
                <GlowCard key={name}>
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-black text-white">{name}</p>
                      {maxWeight > 0 && (
                        <span className="text-[11px] font-black text-accent">{t('session.max')} {maxWeight} {t('common.kg')}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sets.map(s => (
                        <span key={s.set_number} className="bg-white/5 text-neutral-400 text-xs font-medium px-2.5 py-1 rounded-lg">
                          S{s.set_number}:{' '}
                          {s.reps_done ? `${s.reps_done} ${t('common.reps')}` : ''}
                          {s.weight_kg ? ` · ${s.weight_kg}${t('common.kg')}` : ''}
                          {s.duration_done_sec ? `${s.duration_done_sec}s` : ''}
                          {s.rpe ? ` · ${t('session.rpe')} ${s.rpe}` : ''}
                        </span>
                      ))}
                    </div>
                    {sets.some(s => s.notes) && (
                      <div className="mt-2 space-y-1">
                        {sets.filter(s => s.notes).map(s => (
                          <p key={s.set_number} className="text-xs text-neutral-500 italic">
                            S{s.set_number}: {s.notes}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </GlowCard>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          to="/"
          className="flex-1 text-center btn-secondary py-3"
        >
          {t('session.backHome')}
        </Link>
        <Link
          to="/progress"
          className="flex-1 text-center btn-primary py-3"
        >
          {t('session.viewProgress')} <i className="bi bi-arrow-right" />
        </Link>
      </div>
    </div>
  )
}
