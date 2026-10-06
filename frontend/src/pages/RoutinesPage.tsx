import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { routineService } from '../services/routineService'
import type { Routine } from '../types/routine'
import { label } from '../utils/labels'
import { apiErrorMessage } from '../utils/apiError'
import { duplicateRoutine } from '../utils/duplicateRoutine'
import { canHide, markHidden, splitHidden } from '../utils/hiddenRoutines'
import { useAsync } from '../hooks/useAsync'
import { useAuthStore } from '../store/useAuthStore'
import DifficultyDots from '../components/ui/DifficultyDots'
import GlowCard from '../components/ui/GlowCard'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'

export default function RoutinesPage() {
  const { t } = useTranslation()
  // Se piden también las ocultas para saber cuántas hay; solo se enseñan al pulsar "Mostrar ocultas"
  const { data, loading, error, reload, setData } = useAsync(() => routineService.getAll({ includeHidden: true }), [])
  const { visible: routines, hidden: hiddenRoutines } = splitHidden(data ?? [])
  const userId = useAuthStore(s => s.mysqlUser?.id)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null)
  const [showHidden, setShowHidden] = useState(false)
  // Última rutina ocultada: muestra el aviso con "Deshacer"
  const [lastHiddenId, setLastHiddenId] = useState<number | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (lastHiddenId === null) return
    const timer = setTimeout(() => setLastHiddenId(null), 6000)
    return () => clearTimeout(timer)
  }, [lastHiddenId])

  const handleHide = async (id: number, e: React.MouseEvent) => {
    e.preventDefault()
    setDeleteError(null)
    try {
      await routineService.hide(id)
      setData(prev => prev && markHidden(prev, id, true))
      setLastHiddenId(id)
    } catch (err) {
      setDeleteError(apiErrorMessage(err, t('routines.hideError')))
    }
  }

  const handleUnhide = async (id: number, e?: React.MouseEvent) => {
    e?.preventDefault()
    setDeleteError(null)
    try {
      await routineService.unhide(id)
      setData(prev => prev && markHidden(prev, id, false))
      setLastHiddenId(null)
    } catch (err) {
      setDeleteError(apiErrorMessage(err, t('routines.unhideError')))
    }
  }

  const handleDuplicate = async (routine: Routine, e: React.MouseEvent) => {
    e.preventDefault()
    if (duplicatingId !== null) return
    setDeleteError(null)
    setDuplicatingId(routine.id)
    try {
      const copy = await duplicateRoutine(routine, t('routines.copySuffix'))
      navigate(`/routines/${copy.id}/edit`)
    } catch (err) {
      setDeleteError(apiErrorMessage(err, t('routines.duplicateError')))
      setDuplicatingId(null)
    }
  }

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

  // Acción de cierre de cada tarjeta: las propias se eliminan; las ajenas se ocultan o se vuelven a mostrar
  const removeAction = (routine: Routine) => {
    if (routine.is_hidden) {
      return (
        <button type="button" onClick={e => handleUnhide(routine.id, e)} className="card-action card-action-edit">
          {t('routines.unhide')}
        </button>
      )
    }
    if (canHide(routine, userId)) {
      return (
        <button type="button" onClick={e => handleHide(routine.id, e)} className="card-action card-action-delete">
          {t('routines.hide')}
        </button>
      )
    }
    return (
      <button onClick={e => handleDelete(routine.id, e)} className="card-action card-action-delete">
        {t('common.delete')}
      </button>
    )
  }

  const renderCard = (routine: Routine) => (
    <GlowCard key={routine.id} className={routine.is_hidden ? 'opacity-70' : undefined}>
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
          {routine.is_hidden && (
            <span className="text-xs font-semibold text-neutral-300 bg-white/10 px-2.5 py-1 rounded-full">
              <i aria-hidden="true" className="bi bi-eye-slash mr-1" />{t('routines.hiddenBadge')}
            </span>
          )}
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
              type="button"
              onClick={e => handleDuplicate(routine, e)}
              disabled={duplicatingId !== null}
              className="card-action card-action-edit disabled:opacity-50"
            >
              {duplicatingId === routine.id ? t('routines.duplicating') : t('routines.duplicate')}
            </button>
            {removeAction(routine)}
          </div>
        </div>
      </Link>
    </GlowCard>
  )

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
          <>
            <Link to="/routines/import" className="btn-ghost-dark">
              <i aria-hidden="true" className="bi bi-clipboard-plus mr-1.5" />{t('routines.import')}
            </Link>
            <Link to="/routines/new" className="btn-primary">
              {t('routines.new')}
            </Link>
          </>
        }
      />

      {deleteError && (
        <p role="alert" className="mb-4 text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-2xl">{deleteError}</p>
      )}

      {lastHiddenId !== null && (
        <div role="status" className="mb-4 flex items-center justify-between gap-3 text-xs font-semibold text-neutral-200 bg-white/5 border border-white/10 px-3 py-2.5 rounded-2xl">
          <span><i aria-hidden="true" className="bi bi-eye-slash mr-1.5" />{t('routines.hidden')}</span>
          <button type="button" onClick={() => handleUnhide(lastHiddenId)} className="font-bold text-accent hover:underline">
            {t('routines.undo')}
          </button>
        </div>
      )}

      {routines.length === 0 ? (
        <EmptyState
          icon="bi-journal-plus"
          title={t('routines.noRoutines')}
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link to="/routines/new" className="btn-primary">{t('routines.createFirst')}</Link>
              <Link to="/routines/import" className="btn-ghost-dark">
                <i aria-hidden="true" className="bi bi-clipboard-plus mr-1.5" />{t('routines.import')}
              </Link>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {routines.map(renderCard)}
        </div>
      )}

      {hiddenRoutines.length > 0 && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setShowHidden(v => !v)}
            aria-expanded={showHidden}
            className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            <i aria-hidden="true" className={showHidden ? 'bi bi-eye-slash mr-1.5' : 'bi bi-eye mr-1.5'} />
            {showHidden ? t('routines.hideHidden') : t('routines.showHidden', { count: hiddenRoutines.length })}
          </button>
          {showHidden && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {hiddenRoutines.map(renderCard)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
