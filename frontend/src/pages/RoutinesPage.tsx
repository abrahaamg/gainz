import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { routineService } from '../services/routineService'
import { label } from '../utils/labels'
import { useAsync } from '../hooks/useAsync'
import DifficultyDots from '../components/ui/DifficultyDots'
import GlowCard from '../components/ui/GlowCard'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'

export default function RoutinesPage() {
  const { t } = useTranslation()
  const { data, loading, error, reload, setData } = useAsync(() => routineService.getAll(), [])
  const routines = data ?? []
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm(t('routines.deleteConfirm'))) return
    setDeleteError(null)
    try {
      await routineService.delete(id)
      setData(prev => prev?.filter(r => r.id !== id))
    } catch {
      setDeleteError(t('routines.deleteError'))
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Spinner />
    </div>
  )

  if (error) return <ErrorState message={t('routines.loadError')} onRetry={reload} />

  return (
    <div>
      <PageHeader
        title={t('routines.title')}
        subtitle={`${routines.length} ${t('common.routines')}`}
        actions={
          <Link to="/routines/new" className="btn-primary">
            {t('routines.new')}
          </Link>
        }
      />

      {deleteError && (
        <p role="alert" className="mb-4 text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-2xl">{deleteError}</p>
      )}

      {routines.length === 0 ? (
        <EmptyState
          icon="bi-journal-plus"
          title={t('routines.noRoutines')}
          action={<Link to="/routines/new" className="btn-primary">{t('routines.createFirst')}</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {routines.map(routine => (
            <GlowCard key={routine.id}>
              <Link
                to={`/routines/${routine.id}`}
                className="block p-5 flex flex-col h-full gap-3"
              >
                <div className="flex justify-between items-start">
                  <h2 className="font-bold text-white leading-tight">{routine.name}</h2>
                  <DifficultyDots level={routine.difficulty} />
                </div>

                {/* Goal + Duration pills */}
                <div className="flex flex-wrap items-center gap-2">
                  {routine.goal && (
                    <span className="text-xs font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full">{label('goals', routine.goal)}</span>
                  )}
                  {routine.estimated_duration_min && (
                    <span className="text-xs font-semibold text-neutral-400 bg-white/5 px-2.5 py-1 rounded-full">{routine.estimated_duration_min} min</span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs font-medium text-neutral-400">
                  {routine.exercise_count !== undefined && (
                    <span><strong className="text-accent">{routine.exercise_count}</strong> {t('common.exercises')}</span>
                  )}
                  <span><strong className="text-accent">{routine.times_completed}</strong>{t('routines.timesCompleted')}</span>
                </div>

                {routine.description && (
                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed italic">{routine.description}</p>
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
