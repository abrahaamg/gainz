import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { exerciseService } from '../services/exerciseService'
import { Exercise } from '../types/exercise'
import OneRMCalculator from '../components/exercises/OneRMCalculator'
import DifficultyDots from '../components/ui/DifficultyDots'
import { translateMuscle } from '../utils/labels'
import GlowCard from '../components/ui/GlowCard'

export default function ExerciseDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    exerciseService.getById(parseInt(id!, 10))
      .then(setExercise)
      .catch(() => setError(t('exercises.exerciseNotFound')))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!exercise) return
    if (!confirm(t('exercises.deleteConfirm', { name: exercise.name }))) return
    setDeleting(true)
    try {
      await exerciseService.delete(exercise.id)
      navigate('/exercises')
    } catch {
      setError(t('exercises.deleteError'))
      setDeleting(false)
    }
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-4">
      <div className="h-8 bg-neutral-200 animate-pulse w-1/2" />
      <div className="h-4 bg-neutral-200 animate-pulse w-1/3" />
      <div className="h-32 bg-neutral-200 animate-pulse" />
    </div>
  )

  if (error || !exercise) return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="border border-red-200 bg-red-50 text-red-600 p-4 text-sm font-medium">{error}</div>
      <button onClick={() => navigate('/exercises')} className="mt-4 text-[11px] font-bold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 transition-colors">
        <i className="bi bi-arrow-left mr-1" />{t('exercises.backToExercises')}
      </button>
    </div>
  )

  const instructions = exercise.instructions
    ? exercise.instructions.split('\n').filter(Boolean)
    : []

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <button onClick={() => navigate('/exercises')} className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-900 mb-8 block transition-colors">
        <i className="bi bi-arrow-left mr-1" />{t('exercises.title')}
      </button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white bg-neutral-900 px-3 py-1 rounded-full">
              {t(`categories.${exercise.category}`)}
            </span>
            <DifficultyDots level={exercise.difficulty} />
          </div>
          <h1 className="page-title">{exercise.name}</h1>
          <p className="text-neutral-400 text-[11px] font-bold uppercase tracking-widest mt-1">
            {translateMuscle(exercise.muscle_group)}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => navigate(`/exercises/${exercise.id}/edit`)}
            className="btn-secondary"
          >
            {t('common.edit')}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-danger disabled:opacity-40"
          >
            {deleting ? t('common.deleting') : t('common.delete')}
          </button>
        </div>
      </div>

      {exercise.description && (
        <div className="bg-accent/5 border border-accent/10 px-5 py-4 mb-8 rounded-2xl">
          <p className="text-neutral-700 text-sm leading-relaxed">{exercise.description}</p>
        </div>
      )}

      {instructions.length > 0 && (
        <div className="mb-8">
          <h2 className="section-title">{t('exercises.instructions')}</h2>
          <ol className="space-y-3">
            {instructions.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="shrink-0 w-7 h-7 bg-neutral-900 text-white flex items-center justify-center text-xs font-bold rounded-full">
                  {i + 1}
                </span>
                <span className="text-neutral-700 text-sm leading-relaxed">{step.replace(/^\d+\.\s*/, '')}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="mb-8">
        <h2 className="section-title">{t('exercises.involvedMuscles')}</h2>
        <div className="flex flex-wrap gap-2">
          <span className="bg-accent/15 border border-accent/30 px-3 py-1.5 text-[11px] font-black text-accent uppercase tracking-wider rounded-full">
            {translateMuscle(exercise.muscle_group)}
          </span>
          {exercise.secondary_muscles.map(m => (
            <span key={m} className="border border-neutral-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-neutral-600 uppercase tracking-wider rounded-full">
              {translateMuscle(m)}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="section-title">{t('exercises.equipment')}</h2>
        {exercise.requires_equipment && exercise.equipment.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {exercise.equipment.map(eq => (
              <span key={eq} className="border border-accent/40 bg-accent/10 px-3 py-1.5 text-[11px] font-bold text-accent-dk uppercase tracking-wider rounded-full">
                {eq}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">{t('exercises.noEquipment')}</span>
        )}
      </div>

      {exercise.notes && (
        <div className="mb-8">
          <GlowCard>
            <div className="p-5">
              <h2 className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.12em] mb-2">{t('exercises.note')}</h2>
              <p className="text-neutral-400 text-sm leading-relaxed">{exercise.notes}</p>
            </div>
          </GlowCard>
        </div>
      )}

      {exercise.video_url && (
        <div className="mb-8">
          <a href={exercise.video_url} target="_blank" rel="noreferrer"
            className="text-[11px] font-black uppercase tracking-wider text-accent hover:text-accent-dk transition-colors">
            {t('exercises.watchVideo')} <i className="bi bi-arrow-right" />
          </a>
        </div>
      )}

      <OneRMCalculator />
    </div>
  )
}
