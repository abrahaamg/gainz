import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { routineService } from '../services/routineService'
import { Routine } from '../types/routine'
import { GOAL_LABELS, DIFFICULTY_LABELS } from '../utils/labels'
import DifficultyDots from '../components/ui/DifficultyDots'
import GlowCard from '../components/ui/GlowCard'

export default function RoutinesPage() {
  const { t } = useTranslation()
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    routineService.getAll()
      .then(setRoutines)
      .catch(() => setError(t('routines.loadError')))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm(t('routines.deleteConfirm'))) return
    await routineService.delete(id)
    setRoutines(prev => prev.filter(r => r.id !== id))
  }

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return <div className="text-center py-16 text-red-500 text-sm font-medium">{error}</div>

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="card header-gradient px-8 py-8 mb-8 flex items-center justify-between border-none">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t('routines.title')}</h1>
          <p className="text-neutral-500 text-xs mt-1">{routines.length} {t('common.routines')}</p>
        </div>
        <Link to="/routines/new" className="btn-primary">
          {t('routines.new')}
        </Link>
      </div>

      {routines.length === 0 ? (
        <div className="card border-dashed p-16 text-center">
          <i className="bi bi-journal-plus text-3xl text-neutral-300 mb-3 block" />
          <p className="text-neutral-400 text-sm font-medium mb-4">{t('routines.noRoutines')}</p>
          <Link to="/routines/new" className="text-[11px] font-black uppercase tracking-wider text-accent hover:text-accent-dk">
            {t('routines.createFirst')} <i className="bi bi-arrow-right" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {routines.map(routine => (
            <GlowCard key={routine.id}>
              <Link
                to={`/routines/${routine.id}`}
                className="block p-5 flex flex-col h-full gap-3"
              >
                <div className="flex justify-between items-start">
                  <h2 className="font-black text-white leading-tight">{routine.name}</h2>
                  <DifficultyDots level={routine.difficulty} />
                </div>

                {/* Goal + Duration pills */}
                <div className="flex flex-wrap items-center gap-2">
                  {routine.goal && (
                    <span className="text-[10px] font-bold text-accent uppercase tracking-wider bg-accent/10 px-2.5 py-1 rounded-full">{GOAL_LABELS[routine.goal] ?? routine.goal}</span>
                  )}
                  {routine.estimated_duration_min && (
                    <span className="text-[10px] font-semibold text-neutral-500 bg-white/5 px-2.5 py-1 rounded-full">{routine.estimated_duration_min} min</span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  {routine.exercise_count !== undefined && (
                    <span><strong className="text-accent">{routine.exercise_count}</strong> {t('common.exercises')}</span>
                  )}
                  <span><strong className="text-accent">{routine.times_completed}</strong>{t('routines.timesCompleted')}</span>
                </div>

                {routine.description && (
                  <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed italic">{routine.description}</p>
                )}

                <div className="flex justify-between items-center mt-auto pt-3 border-t border-white/10">
                  <button
                    onClick={e => { e.preventDefault(); navigate(`/session/${routine.id}`) }}
                    className="btn-primary py-1.5 px-4"
                  >
                    {t('routines.start')}
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={e => { e.preventDefault(); navigate(`/routines/${routine.id}/edit`) }}
                      className="card-action card-action-edit"
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      onClick={e => handleDelete(routine.id, e)}
                      className="card-action card-action-delete"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              </Link>
            </GlowCard>
          ))}
        </div>
      )}
    </div>
  )
}
