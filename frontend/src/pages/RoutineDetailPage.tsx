import { useState, type ReactNode } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { routineService } from '../services/routineService'
import type { RoutineExercise } from '../types/routine'
import { label, translateMuscle } from '../utils/labels'
import { apiErrorMessage } from '../utils/apiError'
import { duplicateRoutine } from '../utils/duplicateRoutine'
import { formatPlan, planFromExercise } from '../utils/setPlan'
import { canHide } from '../utils/hiddenRoutines'
import { exerciseSummary, exercisesReorderPayload, moveItem } from '../utils/reorder'
import { useAsync } from '../hooks/useAsync'
import { useAuthStore } from '../store/useAuthStore'
import DifficultyDots from '../components/ui/DifficultyDots'
import GlowCard from '../components/ui/GlowCard'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'
import SortableItem from '../components/ui/SortableItem'

function parseMuscles(value: unknown): string[] {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string') return []
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Botones de cabecera: mismo alto y texto centrado; en la fila de 3 del móvil, menos padding
const headerBtn = 'w-full px-2 text-center leading-tight sm:w-auto sm:px-5'

export default function RoutineDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: routine, loading, error, reload, setData } = useAsync(() => routineService.getById(Number(id)), [id])
  const exercises = routine?.exercises ?? []
  const userId = useAuthStore(s => s.mysqlUser?.id)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [duplicating, setDuplicating] = useState(false)
  // Se acaba de ocultar desde aquí: muestra el aviso con "Deshacer"
  const [justHidden, setJustHidden] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const setHidden = async (hidden: boolean) => {
    setDeleteError(null)
    try {
      if (hidden) await routineService.hide(Number(id))
      else await routineService.unhide(Number(id))
      setData(prev => prev && { ...prev, is_hidden: hidden })
      setJustHidden(hidden)
    } catch (err) {
      setDeleteError(apiErrorMessage(err, t(hidden ? 'routines.hideError' : 'routines.unhideError')))
    }
  }

  const handleDelete = async () => {
    if (!confirm(t('routines.deleteConfirm'))) return
    setDeleteError(null)
    try {
      await routineService.delete(Number(id))
      navigate('/routines')
    } catch {
      setDeleteError(t('routines.deleteError'))
    }
  }

  const handleDuplicate = async () => {
    if (!routine || duplicating) return
    setDuplicating(true)
    setDeleteError(null)
    try {
      const copy = await duplicateRoutine(routine, t('routines.copySuffix'))
      navigate(`/routines/${copy.id}/edit`)
    } catch (err) {
      setDeleteError(apiErrorMessage(err, t('routines.duplicateError')))
      setDuplicating(false)
    }
  }

  // Al soltar: se reordena al momento y se guarda la lista completa; si falla, vuelve el orden anterior
  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!routine) return
    const reordered = moveItem(exercises, ex => ex.re_id, active.id, over?.id)
    if (reordered === exercises) return
    const withIndex = reordered.map((ex, i) => ({ ...ex, order_index: i }))
    setDeleteError(null)
    setData(prev => prev && { ...prev, exercises: withIndex })
    try {
      await routineService.update(routine.id, { exercises: exercisesReorderPayload(withIndex) })
    } catch {
      setData(prev => prev && { ...prev, exercises })
      setDeleteError(t('routines.reorderError'))
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Spinner />
    </div>
  )

  if (error || !routine) return (
    <ErrorState message={t('routines.routineNotFound')} onRetry={reload} />
  )

  const isOwn = userId !== undefined && routine.user_id === userId

  const renderExercise = (ex: RoutineExercise, i: number, handle?: ReactNode) => {
    const isOpen = expandedId === ex.re_id
    const secondaryMuscles = parseMuscles(ex.secondary_muscles)
    const panelId = `exercise-panel-${ex.re_id}`

    return (
      <GlowCard>
        <div className="flex items-center gap-1 py-1 pl-1 pr-3">
          {handle ?? <span className="w-2 shrink-0" />}
          <button
            type="button"
            onClick={() => setExpandedId(isOpen ? null : ex.re_id)}
            aria-expanded={isOpen}
            aria-controls={panelId}
            className="flex min-h-[52px] flex-1 items-center gap-3 text-left min-w-0"
          >
            <span className="text-accent font-mono text-sm w-5 shrink-0 font-bold">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold text-white">{ex.exercise_name}</span>
              <span className="block text-xs font-medium tabular-nums text-neutral-400">
                {exerciseSummary(ex, t('common.sets'))}
              </span>
            </span>
            <i aria-hidden="true" className={`bi bi-chevron-${isOpen ? 'up' : 'down'} shrink-0 text-neutral-400 text-xs`} />
          </button>
        </div>

        {/* Desplegable con la info completa del ejercicio */}
        <div id={panelId} inert={!isOpen} className={`dropdown-panel ${isOpen ? 'open' : ''}`}>
          <div>
            <div className="mx-4 mb-4 border-t border-white/10 pt-4 space-y-3">
              {ex.duration_seconds === null ? (
                <ol aria-label={t('routines.planPerSet')} className="flex flex-wrap gap-1.5">
                  {planFromExercise(ex).map((s, n) => (
                    <li
                      key={n}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold tabular-nums text-neutral-300"
                    >
                      <span className="text-accent">S{n + 1}</span>{' '}
                      {formatPlan([s]).replace(/^S1 /, '')}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs font-semibold tabular-nums text-neutral-300">{ex.sets}×{ex.duration_seconds}s</p>
              )}

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                <div>
                  <span className="text-neutral-400 font-semibold">{t('routines.restSeconds')}: </span>
                  <span className="text-white font-bold tabular-nums">{ex.rest_seconds}</span>
                </div>
                <div>
                  <span className="text-neutral-400 font-semibold">{t('exercises.muscle')}: </span>
                  <span className="text-white font-bold">{translateMuscle(ex.muscle_group)}</span>
                </div>
                {secondaryMuscles.length > 0 && (
                  <div>
                    <span className="text-neutral-400 font-semibold">{t('exercises.secondaryMuscles')}: </span>
                    <span className="text-neutral-300 font-medium">{secondaryMuscles.map(m => translateMuscle(m)).join(', ')}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-400 font-semibold">{t('exercises.difficulty')}: </span>
                  <DifficultyDots level={ex.difficulty} />
                  <span className="text-neutral-300 font-medium">{label('difficulty', ex.difficulty)}</span>
                </div>
              </div>

              {ex.notes && (
                <div className="bg-white/5 px-3 py-2 rounded-xl">
                  <p className="text-xs font-semibold text-neutral-400">{t('routines.routineNoteLabel')}</p>
                  <p className="text-xs text-neutral-300">{ex.notes}</p>
                </div>
              )}
              {ex.exercise_notes && (
                <div className="bg-white/5 px-3 py-2 rounded-xl">
                  <p className="text-xs font-semibold text-neutral-400">{t('routines.exerciseNoteLabel')}</p>
                  <p className="text-xs text-neutral-300">{ex.exercise_notes}</p>
                </div>
              )}

              {ex.description && (
                <p className="text-sm text-neutral-300 leading-relaxed">{ex.description}</p>
              )}

              {(ex.requires_equipment || ex.is_unilateral) && (
                <div className="flex flex-wrap gap-1.5">
                  {ex.requires_equipment && (
                    <span className="text-xs font-bold bg-white/5 border border-white/10 text-neutral-400 px-2 py-1 rounded-full">
                      <i className="bi bi-wrench mr-1" />{t('exercises.requiresEquipment')}
                    </span>
                  )}
                  {ex.is_unilateral && (
                    <span className="text-xs font-bold bg-white/5 border border-white/10 text-neutral-400 px-2 py-1 rounded-full">
                      <i className="bi bi-arrow-left-right mr-1" />{t('exercises.unilateral')}
                    </span>
                  )}
                </div>
              )}

              {ex.instructions && (
                <div>
                  <p className="text-xs font-medium text-neutral-400 mb-1.5">{t('exercises.instructions')}</p>
                  <div className="text-sm text-neutral-400 leading-relaxed space-y-1">
                    {ex.instructions.split('\n').map((line, j) => (
                      <p key={j}>{line}</p>
                    ))}
                  </div>
                </div>
              )}

              <Link
                to={`/exercises/${ex.exercise_id}`}
                className="inline-block text-xs font-bold text-accent hover:text-white transition-colors"
              >
                {t('exercises.viewDetail')} <i className="bi bi-arrow-right" />
              </Link>
            </div>
          </div>
        </div>
      </GlowCard>
    )
  }

  return (
    <div>
      <Link to="/routines" className="text-xs font-medium text-neutral-400 hover:text-neutral-900 mb-8 block transition-colors">
        <i className="bi bi-arrow-left mr-1" />{t('nav.routines')}
      </Link>

      {deleteError && (
        <p role="alert" className="mb-4 text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-2xl">{deleteError}</p>
      )}

      {justHidden && (
        <div role="status" className="mb-4 flex items-center justify-between gap-3 text-xs font-semibold text-neutral-200 bg-white/5 border border-white/10 px-3 py-2.5 rounded-2xl">
          <span><i aria-hidden="true" className="bi bi-eye-slash mr-1.5" />{t('routines.hidden')}</span>
          <button type="button" onClick={() => setHidden(false)} className="font-bold text-accent hover:underline">
            {t('routines.undo')}
          </button>
        </div>
      )}

      <GlowCard className="mb-6">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4 gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-black text-white tracking-tight">{routine.name}</h1>
              {routine.description && (
                <p className="text-neutral-400 text-sm mt-2">{routine.description}</p>
              )}
            </div>
            {/* Móvil: Empezar a lo ancho y debajo una fila de 3 iguales; escritorio: todos en línea */}
            <div className="w-full space-y-2 sm:flex sm:w-auto sm:gap-2 sm:space-y-0">
              <button
                type="button"
                onClick={() => navigate(`/session/${routine.id}`)}
                className="btn-primary w-full px-5 sm:w-auto"
              >
                {t('routines.start')}
              </button>
              <div className="grid grid-cols-3 gap-2 sm:flex">
                <Link to={`/routines/${routine.id}/edit`} className={`btn-ghost-dark ${headerBtn}`}>
                  {t('common.edit')}
                </Link>
                <button
                  type="button"
                  onClick={handleDuplicate}
                  disabled={duplicating}
                  className={`btn-ghost-dark ${headerBtn}`}
                >
                  {duplicating ? t('routines.duplicating') : t('routines.duplicate')}
                </button>
                {routine.is_hidden ? (
                  <button type="button" onClick={() => setHidden(false)} className={`btn-ghost-dark ${headerBtn}`}>
                    {t('routines.unhide')}
                  </button>
                ) : canHide(routine, userId) ? (
                  <button type="button" onClick={() => setHidden(true)} className={`btn-danger-dark ${headerBtn}`}>
                    {t('routines.hide')}
                  </button>
                ) : (
                  <button type="button" onClick={handleDelete} className={`btn-danger-dark ${headerBtn}`}>
                    {t('common.delete')}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {routine.goal && (
              <span className="border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-neutral-300 rounded-full">
                {label('goals', routine.goal)}
              </span>
            )}
            {routine.estimated_duration_min && (
              <span className="border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-neutral-300 rounded-full">
                {routine.estimated_duration_min} min
              </span>
            )}
            <span className="border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-neutral-300 rounded-full">
              {exercises.length} {t('common.exercises')}
            </span>
            <span className="border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent rounded-full">
              {routine.times_completed}{t('routines.timesCompleted')}
            </span>
          </div>
        </div>
      </GlowCard>

      {routine.warmup_notes && (
        <GlowCard className="mb-6">
          <div className="px-5 py-4">
            <p className="section-title mb-2 text-accent">{t('routines.warmup')}</p>
            <p className="text-sm text-neutral-300">{routine.warmup_notes}</p>
          </div>
        </GlowCard>
      )}

      <div className="space-y-2">
        <h2 className="section-title">{t('nav.exercises')}</h2>
        {exercises.length === 0 ? (
          <p className="text-neutral-400 text-sm font-medium">{t('routines.noExercises')}</p>
        ) : isOwn ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={exercises.map(ex => ex.re_id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {exercises.map((ex, i) => (
                  <SortableItem
                    key={ex.re_id}
                    id={ex.re_id}
                    handleLabel={t('routines.dragExercise', { name: ex.exercise_name })}
                  >
                    {handle => renderExercise(ex, i, handle)}
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <>
            <GlowCard className="mb-3">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <p className="flex-1 min-w-[12rem] text-xs font-medium text-neutral-300">
                  <i aria-hidden="true" className="bi bi-info-circle mr-1.5 text-accent" />{t('routines.duplicateToEdit')}
                </p>
                <button
                  type="button"
                  onClick={handleDuplicate}
                  disabled={duplicating}
                  className="btn-ghost-dark px-5"
                >
                  {duplicating ? t('routines.duplicating') : t('routines.duplicate')}
                </button>
              </div>
            </GlowCard>
            {exercises.map((ex, i) => <div key={ex.re_id}>{renderExercise(ex, i)}</div>)}
          </>
        )}
      </div>

      {routine.cooldown_notes && (
        <GlowCard className="mt-6">
          <div className="px-5 py-4">
            <p className="section-title mb-2 text-accent">{t('routines.cooldown')}</p>
            <p className="text-sm text-neutral-300">{routine.cooldown_notes}</p>
          </div>
        </GlowCard>
      )}
    </div>
  )
}
