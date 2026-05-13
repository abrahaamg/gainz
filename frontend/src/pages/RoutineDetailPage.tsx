import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { routineService } from '../services/routineService'
import { Routine, RoutineExercise } from '../types/routine'
import { CATEGORY_LABELS, DIFFICULTY_LABELS, GOAL_LABELS, translateMuscle } from '../utils/labels'
import DifficultyDots from '../components/ui/DifficultyDots'
import GlowCard from '../components/ui/GlowCard'

export default function RoutineDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [routine, setRoutine]     = useState<Routine | null>(null)
  const [exercises, setExercises] = useState<RoutineExercise[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    routineService.getById(Number(id))
      .then(r => { setRoutine(r); setExercises(r.exercises ?? []) })
      .catch(() => setError(t('routines.routineNotFound')))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!confirm(t('routines.deleteConfirm'))) return
    await routineService.delete(Number(id))
    navigate('/routines')
  }

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error || !routine) return (
    <div className="text-center py-16 text-red-500 text-sm font-medium">{error ?? 'Error'}</div>
  )

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link to="/routines" className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-900 mb-8 block transition-colors">
        <i className="bi bi-arrow-left mr-1" />{t('nav.routines')}
      </Link>

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
                className="border border-white/15 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white font-semibold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full transition-all"
              >
                {t('common.edit')}
              </Link>
              <button
                onClick={handleDelete}
                className="border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-semibold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full transition-all"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {routine.goal && (
              <span className="border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-neutral-300 uppercase tracking-wider rounded-full">
                {GOAL_LABELS[routine.goal] ?? routine.goal}
              </span>
            )}
            {routine.estimated_duration_min && (
              <span className="border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-neutral-300 uppercase tracking-wider rounded-full">
                {routine.estimated_duration_min} min
              </span>
            )}
            <span className="border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-neutral-300 uppercase tracking-wider rounded-full">
              {exercises.length} {t('common.exercises')}
            </span>
            <span className="border border-accent/30 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold text-accent uppercase tracking-wider rounded-full">
              {routine.times_completed}{t('routines.timesCompleted')}
            </span>
          </div>
        </div>
      </GlowCard>

      {routine.warmup_notes && (
        <GlowCard className="mb-6">
          <div className="px-5 py-4">
            <p className="text-[11px] font-bold text-accent uppercase tracking-[0.12em] mb-2">{t('routines.warmup')}</p>
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
            const secondaryMuscles: string[] = Array.isArray(ex.secondary_muscles)
              ? ex.secondary_muscles
              : typeof ex.secondary_muscles === 'string'
                ? JSON.parse(ex.secondary_muscles || '[]')
                : []

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
                          <p className="font-black text-white">{ex.exercise_name}</p>
                          <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} text-neutral-500 text-xs transition-transform`} />
                        </div>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                            {CATEGORY_LABELS[ex.category] ?? ex.category}
                          </span>
                          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                            {translateMuscle(ex.muscle_group)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm shrink-0">
                      <p className="font-black text-white">
                        {ex.sets}×{ex.reps ? `${ex.reps}` : `${ex.duration_seconds}s`}
                      </p>
                      <p className="text-[11px] font-semibold text-neutral-500">{ex.rest_seconds}s {t('routines.rest')}</p>
                      {ex.weight_suggestion && (
                        <p className="text-[11px] font-black text-accent">{ex.weight_suggestion} {t('common.kg')}</p>
                      )}
                    </div>
                  </div>

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
                          <span className="text-neutral-500 font-semibold uppercase tracking-wider">{t('exercises.muscle')}: </span>
                          <span className="text-white font-bold">{translateMuscle(ex.muscle_group)}</span>
                        </div>
                        {secondaryMuscles.length > 0 && (
                          <div>
                            <span className="text-neutral-500 font-semibold uppercase tracking-wider">{t('exercises.secondaryMuscles')}: </span>
                            <span className="text-neutral-300 font-medium">{secondaryMuscles.map(m => translateMuscle(m)).join(', ')}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className="text-neutral-500 font-semibold uppercase tracking-wider">{t('exercises.difficulty')}: </span>
                          <DifficultyDots level={ex.difficulty} />
                          <span className="text-neutral-300 font-medium">{DIFFICULTY_LABELS[ex.difficulty] ?? ex.difficulty}</span>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5">
                        {ex.requires_equipment && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-neutral-400 px-2 py-1 rounded-full">
                            <i className="bi bi-wrench mr-1" />{t('exercises.requiresEquipment')}
                          </span>
                        )}
                        {ex.is_unilateral && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-neutral-400 px-2 py-1 rounded-full">
                            <i className="bi bi-arrow-left-right mr-1" />{t('exercises.unilateral')}
                          </span>
                        )}
                      </div>

                      {/* Instrucciones */}
                      {ex.instructions && (
                        <div>
                          <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">{t('exercises.instructions')}</p>
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
                        className="inline-block text-[11px] font-bold text-accent hover:text-white uppercase tracking-wider transition-colors"
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
                      <p className="text-xs text-neutral-500">{ex.exercise_notes}</p>
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
            <p className="text-[11px] font-bold text-accent uppercase tracking-[0.12em] mb-2">{t('routines.cooldown')}</p>
            <p className="text-sm text-neutral-300">{routine.cooldown_notes}</p>
          </div>
        </GlowCard>
      )}
    </div>
  )
}
