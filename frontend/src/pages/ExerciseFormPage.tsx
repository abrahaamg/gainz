import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { exerciseService } from '../services/exerciseService'
import { apiErrorMessage } from '../utils/apiError'
import { ExerciseCategory, Difficulty, CreateExerciseDTO } from '../types/exercise'
import { label } from '../utils/labels'
import GlowCard from '../components/ui/GlowCard'
import PageHeader from '../components/ui/PageHeader'
import ErrorState from '../components/ui/ErrorState'
import Skeleton from '../components/ui/Skeleton'

const CATEGORIES: { value: ExerciseCategory; labelKey: string }[] = [
  { value: 'strength', labelKey: 'categories.strength' },
  { value: 'cardio', labelKey: 'categories.cardio' },
  { value: 'flexibility', labelKey: 'categories.flexibility' },
  { value: 'hiit', labelKey: 'categories.hiit' },
  { value: 'balance', labelKey: 'categories.balance' },
]

const MUSCLE_GROUPS = [
  'chest', 'lats', 'upper_back',
  'quadriceps', 'hamstrings', 'glutes', 'calves',
  'shoulders', 'biceps', 'triceps', 'forearms',
  'core', 'full_body',
]

const DIFFICULTIES: { value: Difficulty; labelKey: string }[] = [
  { value: 'easy', labelKey: 'difficulty.easy' },
  { value: 'medium', labelKey: 'difficulty.medium' },
  { value: 'hard', labelKey: 'difficulty.hard' },
]

const EMPTY_FORM: CreateExerciseDTO = {
  name: '',
  category: 'strength',
  muscle_group: 'chest',
  secondary_muscles: [],
  difficulty: 'medium',
  description: '',
  instructions: '',
  notes: '',
  requires_equipment: false,
  is_unilateral: false,
  is_public: true,
  equipment: [],
}

export default function ExerciseFormPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [form, setForm] = useState<CreateExerciseDTO>(EMPTY_FORM)
  const [equipmentInput, setEquipmentInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEditing)
  const [error, setError] = useState<string | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!isEditing || !id) return
    const fetch = async () => {
      setFetchLoading(true)
      setLoadFailed(false)
      try {
        const exercise = await exerciseService.getById(parseInt(id, 10))
        setForm({
          name: exercise.name,
          category: exercise.category,
          muscle_group: exercise.muscle_group,
          secondary_muscles: exercise.secondary_muscles ?? [],
          difficulty: exercise.difficulty,
          description: exercise.description ?? '',
          instructions: exercise.instructions ?? '',
          notes: exercise.notes ?? '',
          requires_equipment: Boolean(exercise.requires_equipment),
          is_unilateral: Boolean(exercise.is_unilateral),
          is_public: Boolean(exercise.is_public),
          equipment: exercise.equipment ?? [],
        })
      } catch {
        setLoadFailed(true)
      } finally {
        setFetchLoading(false)
      }
    }
    fetch()
  }, [id, isEditing, reloadKey])

  const set = <K extends keyof CreateExerciseDTO>(key: K, value: CreateExerciseDTO[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const addEquipment = () => {
    const trimmed = equipmentInput.trim()
    if (!trimmed || form.equipment?.includes(trimmed)) return
    set('equipment', [...(form.equipment ?? []), trimmed])
    setEquipmentInput('')
  }

  const removeEquipment = (name: string) => {
    set('equipment', (form.equipment ?? []).filter((e) => e !== name))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError(t('exercises.nameRequired')); return }
    if (!form.description?.trim()) { setError(t('exercises.descriptionRequired')); return }
    if (!form.instructions?.trim()) { setError(t('exercises.instructionsRequired')); return }
    setLoading(true)
    setError(null)
    try {
      if (isEditing && id) {
        await exerciseService.update(parseInt(id, 10), form)
        navigate(`/exercises/${id}`)
      } else {
        const created = await exerciseService.create(form)
        navigate(`/exercises/${created.id}`)
      }
    } catch (err: unknown) {
      const msg = apiErrorMessage(err, t('exercises.saveError'))
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const title = isEditing ? t('exercises.editExercise') : t('exercises.newExercise')
  const backButton = (
    <button type="button" onClick={() => navigate('/exercises')} className="btn-ghost-dark">
      <i aria-hidden="true" className="bi bi-arrow-left mr-1.5" />{t('exercises.backToExercises')}
    </button>
  )

  if (fetchLoading) {
    return (
      <div role="status" aria-busy="true" className="mx-auto max-w-2xl space-y-4">
        <Skeleton tone="dark" className="h-24 rounded-apple" />
        <Skeleton tone="dark" className="h-96 rounded-apple" />
      </div>
    )
  }

  if (loadFailed) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title={title} actions={backButton} />
        <ErrorState message={t('exercises.loadError')} onRetry={() => setReloadKey(k => k + 1)} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={title} actions={backButton} />

      {error && (
        <div role="alert" className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm font-medium text-red-300">{error}</div>
      )}

      <GlowCard>
      <form onSubmit={handleSubmit} noValidate className="space-y-6 p-5 sm:p-6">
        {/* Nombre */}
        <div>
          <label htmlFor="ex-name" className="form-label">{t('exercises.name')}</label>
          <input
            id="ex-name" type="text" required value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder={t('exercises.namePlaceholder')}
            className="form-input"
          />
        </div>

        {/* Categoría */}
        <div>
          <p id="ex-category" className="form-label">{t('exercises.category')}</p>
          <div role="group" aria-labelledby="ex-category" className="flex flex-wrap gap-2">
            {CATEGORIES.map(({ value, labelKey }) => (
              <button key={value} type="button"
                aria-pressed={form.category === value}
                onClick={() => set('category', value)}
                className={`chip ${form.category === value ? 'chip-active' : ''}`}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Músculo principal */}
        <div>
          <label htmlFor="ex-muscle" className="form-label">{t('exercises.mainMuscle')}</label>
          <select
            id="ex-muscle"
            value={form.muscle_group}
            onChange={(e) => set('muscle_group', e.target.value)}
            className="form-input"
          >
            {MUSCLE_GROUPS.map((m) => (
              <option key={m} value={m}>{label('muscles', m)}</option>
            ))}
          </select>
        </div>

        {/* Músculos secundarios */}
        <div>
          <p id="ex-secondary" className="form-label">
            {t('exercises.secondaryMuscles')} <span className="font-normal text-neutral-400">({t('exercises.secondaryMusclesHint')})</span>
          </p>
          <div role="group" aria-labelledby="ex-secondary" className="flex flex-wrap gap-2">
            {MUSCLE_GROUPS.filter(m => m !== form.muscle_group && m !== 'full_body').map(m => {
              const active = form.secondary_muscles?.includes(m)
              return (
                <button key={m} type="button"
                  aria-pressed={Boolean(active)}
                  onClick={() => {
                    const current = form.secondary_muscles ?? []
                    set('secondary_muscles', active
                      ? current.filter(x => x !== m)
                      : [...current, m])
                  }}
                  className={`chip ${active ? 'chip-active' : ''}`}
                >
                  {label('muscles', m)}
                </button>
              )
            })}
          </div>
        </div>

        {/* Dificultad */}
        <div>
          <p id="ex-difficulty" className="form-label">{t('exercises.difficulty')}</p>
          <div role="group" aria-labelledby="ex-difficulty" className="flex flex-wrap gap-2">
            {DIFFICULTIES.map(({ value, labelKey }) => (
              <button key={value} type="button"
                aria-pressed={form.difficulty === value}
                onClick={() => set('difficulty', value)}
                className={`chip ${form.difficulty === value ? 'chip-active' : ''}`}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="ex-description" className="form-label">{t('exercises.description')}</label>
          <textarea id="ex-description" rows={3} value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
            placeholder={t('exercises.descriptionPlaceholder')}
            className="form-input"
          />
        </div>

        {/* Instrucciones */}
        <div>
          <label htmlFor="ex-instructions" className="form-label">
            {t('exercises.instructionsLabel')}
          </label>
          <textarea id="ex-instructions" rows={5} value={form.instructions ?? ''}
            onChange={(e) => set('instructions', e.target.value)}
            placeholder={t('exercises.instructionsPlaceholder')}
            className="form-input"
          />
        </div>

        {/* Notas del creador */}
        <div>
          <label htmlFor="ex-notes" className="form-label">
            {t('exercises.creatorNotes')}
          </label>
          <textarea id="ex-notes" rows={2} value={form.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
            placeholder={t('exercises.creatorNotesPlaceholder')}
            className="form-input"
          />
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-6">
          {[
            { key: 'requires_equipment' as const, labelKey: 'exercises.requiresEquipmentToggle' },
            { key: 'is_unilateral' as const, labelKey: 'exercises.unilateral' },
            { key: 'is_public' as const, labelKey: 'exercises.publicExercise' },
          ].map(({ key, labelKey }) => (
            <label key={key} className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={Boolean(form[key])}
                onChange={(e) => set(key, e.target.checked)}
                className="w-4 h-4 accent-accent"
              />
              <span className="text-sm font-medium text-neutral-200">{t(labelKey)}</span>
            </label>
          ))}
        </div>

        {/* Equipamiento requerido */}
        {form.requires_equipment && (
          <div>
            <label htmlFor="ex-equipment" className="form-label">{t('exercises.requiredEquipment')}</label>
            <div className="flex gap-2 mb-3">
              <input id="ex-equipment" type="text" value={equipmentInput}
                onChange={(e) => setEquipmentInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEquipment() } }}
                placeholder={t('exercises.equipmentPlaceholder')}
                className="flex-1 form-input"
              />
              <button type="button" onClick={addEquipment}
                className="btn-ghost-dark">
                {t('exercises.add')}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(form.equipment ?? []).map((eq) => (
                <span key={eq} className="border border-accent/30 bg-accent/10 text-white px-3 py-1.5 text-xs font-bold flex items-center gap-1 rounded-full">
                  {eq}
                  <button type="button" onClick={() => removeEquipment(eq)}
                    aria-label={`${t('common.delete')} ${eq}`}
                    className="ml-1 text-neutral-400 hover:text-red-400 font-bold leading-none">×</button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 btn-primary py-3 disabled:opacity-50">
            {loading ? t('common.saving') : isEditing ? t('exercises.saveChanges') : t('exercises.createExercise')}
          </button>
          <button type="button" onClick={() => navigate('/exercises')}
            className="btn-ghost-dark">
            {t('common.cancel')}
          </button>
        </div>
      </form>
      </GlowCard>
    </div>
  )
}
