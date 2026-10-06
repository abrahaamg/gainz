import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { routineService } from '../services/routineService'
import { label, translateMuscle } from '../utils/labels'
import { apiErrorMessage } from '../utils/apiError'
import { duplicateRoutine } from '../utils/duplicateRoutine'
import { formatPlan, planFromExercise } from '../utils/setPlan'
import { useAsync } from '../hooks/useAsync'
import DifficultyDots from '../components/ui/DifficultyDots'
import GlowCard from '../components/ui/GlowCard'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'

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

export default function RoutineDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: routine, loading, error, reload } = useAsync(() => routineService.getById(Number(id)), [id])
  const exercises = routine?.exercises ?? []
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [duplicating, setDuplicating] = useState(false)

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

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Spinner />
    </div>
  )

  if (error || !routine) return (
    <ErrorState message={t('routines.routineNotFound')} onRetry={reload} />
  )

  return (
    <div>
      <Link to="/routines" className="text-xs font-medium text-neutral-400 hover:text-neutral-900 mb-8 block transition-colors">
        <i className="bi bi-arrow-left mr-1" />{t('nav.routines')}
      </Link>

      {deleteError && (
        <p role="alert" className="mb-4 text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-2xl">{deleteError}</p>
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
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => navigate(`/session/${routine.id}`)}
                className="btn-primary"
              >
                {t('routines.start')}
              </button>
              <Link
                to={`/routines/${routine.id}/edit`}
                className="border border-white/15 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white font-semibold text-xs px-5 py-2.5 rounded-full transition-all"
              >
                {t('common.edit')}
              </Link>
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={duplicating}
                className="border border-white/15 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white font-semibold text-xs px-5 py-2.5 rounded-full transition-all disabled:opacity-50"
              >
                {duplicating ? t('routines.duplicating') : t('routines.duplicate')}
              </button>
              <button
                onClick={handleDelete}
                className="border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-semibold text-xs px-5 py-2.5 rounded-full transition-all"
              >
                {t('common.delete')}
              </button>
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
        ) : (
          exercises.map((ex, i) => {
            const isOpen = expandedId === ex.re_id
            const secondaryMuscles = parseMuscles(ex.secondary_muscles)

            return (
              <GlowCard key={ex.re_id}>
                <div className="p-4">
                  <div
                    className="flex justify-between items-start cursor-pointer"
                    onClick={() => setExpandedId(isOpen ? null : ex.re_id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-accent font-mono text-sm w-5 shrink-0 font-bold">{i + 1}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white">{ex.exercise_name}</p>
                          <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} text-neutral-400 text-xs transition-transform`} />
                        </div>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs font-medium text-neutral-400">
                            {label('categories', ex.category)}
                          </span>
                          <span className="text-xs font-medium text-neutral-400">
                            {translateMuscle(ex.muscle_group)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm shrink-0">
                      <p className="font-bold text-white">
                        {ex.duration_seconds !== null
                          ? `${ex.sets}×${ex.duration_seconds}s`
                          : `${ex.sets} ${t('common.sets')}`}
                      </p>
                      <p className="text-xs font-semibold text-neutral-400">{ex.rest_seconds}s {t('routines.rest')}</p>
                    </div>
                  </div>

                  {ex.duration_seconds === null && (
                    <ol
                      aria-label={t('routines.planPerSet')}
                      className="mt-3 flex flex-wrap gap-1.5"
                    >
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
                  )}

                  {/* Desplegable con info del ejercicio */}
                  <div className={`dropdown-panel ${isOpen ? 'open' : ''}`}>
                    <div className="mt-4 border-t border-white/10 pt-4 space-y-3">
                      {/* Descripción */}
                      {ex.description && (
                        <p className="text-sm text-neutral-300 leading-relaxed">{ex.description}</p>
                      )}

                      {/* Músculos + Dificultad */}
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
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

                      {/* Badges */}
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

                      {/* Instrucciones */}
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

                      {/* Link al detalle */}
                      <Link
                        to={`/exercises/${ex.exercise_id}`}
                        className="inline-block text-xs font-bold text-accent hover:text-white transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        {t('exercises.viewDetail')} <i className="bi bi-arrow-right" />
                      </Link>
                    </div>
                  </div>

                  {ex.notes && (
                    <div className="mt-3 bg-white/5 px-3 py-2 rounded-xl">
                      <p className="text-xs text-neutral-400">{ex.notes}</p>
                    </div>
                  )}
                  {ex.exercise_notes && (
                    <div className="mt-2 bg-white/5 px-3 py-2 rounded-xl">
                      <p className="text-xs text-neutral-400">{ex.exercise_notes}</p>
                    </div>
                  )}
                </div>
              </GlowCard>
            )
          })
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
