import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../ui/Modal'
import GlowCard from '../ui/GlowCard'
import { exerciseService } from '../../services/exerciseService'
import { apiErrorMessage } from '../../utils/apiError'
import { label } from '../../utils/labels'
import { EXERCISE_CATEGORIES, EXERCISE_DIFFICULTIES, EXERCISE_MUSCLE_GROUPS } from '../../utils/exerciseOptions'
import { editMode, saveEditedExercise, type EditableExercise, type EditMode } from '../../utils/routineImport/exerciseEdit'
import type { Difficulty, Exercise, ExerciseCategory } from '../../types/exercise'

interface Props {
  /** Ejercicio a editar; null = modal cerrado. */
  exercise: EditableExercise | null
  userId: number | null | undefined
  onClose: () => void
  onSaved: (result: { exercise: Exercise; mode: EditMode }) => void
}

/** Modal "Editar ejercicio" del paso Revisar. Propio → se actualiza; del catálogo → se guarda una copia propia. */
export default function ExerciseEditModal({ exercise, userId, onClose, onSaved }: Props) {
  return (
    <Modal open={exercise !== null} onClose={onClose} labelledBy="edit-ex-title" placement="sheet">
      {exercise && <EditForm key={exercise.id} exercise={exercise} userId={userId} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  )
}

function EditForm({ exercise, userId, onClose, onSaved }: Omit<Props, 'exercise'> & { exercise: EditableExercise }) {
  const { t } = useTranslation()
  const uid = useId()
  const mode = editMode(exercise, userId)
  const [name, setName] = useState(exercise.name)
  const [category, setCategory] = useState<ExerciseCategory>(exercise.category)
  const [muscle, setMuscle] = useState(exercise.muscle_group)
  const [secondary, setSecondary] = useState<string[]>(exercise.secondary_muscles ?? [])
  const [difficulty, setDifficulty] = useState<Difficulty>(exercise.difficulty ?? 'medium')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // El catálogo usa también grupos amplios (legs, arms, back): se conservan como opción si ya vienen así.
  const muscles = EXERCISE_MUSCLE_GROUPS.includes(muscle) ? EXERCISE_MUSCLE_GROUPS : [muscle, ...EXERCISE_MUSCLE_GROUPS]
  const secondaryOptions = muscles.filter(m => m !== muscle && m !== 'full_body')

  const toggleSecondary = (m: string) =>
    setSecondary(prev => (prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      const result = await saveEditedExercise(
        exercise,
        { name, category, muscle_group: muscle, secondary_muscles: secondary, difficulty },
        userId,
        exerciseService,
      )
      onSaved(result)
    } catch (err) {
      setError(apiErrorMessage(err, t('routineImport.edit.error')))
      setSaving(false)
    }
  }

  const chips = <T extends string>(
    groupLabelId: string, values: T[], isActive: (v: T) => boolean, onToggle: (v: T) => void,
    text: (v: T) => string,
  ) => (
    <div role="group" aria-labelledby={groupLabelId} className="flex flex-wrap gap-2">
      {values.map(v => (
        <button
          key={v} type="button" aria-pressed={isActive(v)} onClick={() => onToggle(v)}
          className={`chip ${isActive(v) ? 'chip-active' : ''}`}
        >
          {text(v)}
        </button>
      ))}
    </div>
  )

  return (
    <GlowCard className="rounded-b-none sm:rounded-b-apple">
      <form onSubmit={submit} className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 id="edit-ex-title" className="text-lg font-bold text-white">{t('routineImport.edit.title')}</h2>
          <button type="button" onClick={onClose} disabled={saving} className="btn-ghost-dark px-3 py-1.5 text-xs">
            {t('common.close')}
          </button>
        </div>

        <p
          className={
            'rounded-2xl border px-3 py-2 text-xs ' +
            (mode === 'copy' ? 'border-accent/30 bg-accent/10 text-neutral-200' : 'border-white/10 bg-white/5 text-neutral-300')
          }
        >
          <i aria-hidden="true" className={`bi ${mode === 'copy' ? 'bi-info-circle' : 'bi-person-check'} mr-1.5`} />
          {mode === 'copy' ? t('routineImport.edit.catalogNote') : t('routineImport.edit.ownNote')}
        </p>

        <div>
          <label htmlFor={`${uid}-name`} className="form-label">{t('exercises.name')}</label>
          <input
            id={`${uid}-name`} value={name} onChange={e => setName(e.target.value)} required maxLength={150}
            className="form-input form-input-dark"
          />
        </div>

        <div>
          <p id={`${uid}-cat`} className="form-label">{t('exercises.category')}</p>
          {chips(`${uid}-cat`, EXERCISE_CATEGORIES, v => category === v, setCategory, v => label('categories', v))}
        </div>

        <div>
          <label htmlFor={`${uid}-mus`} className="form-label">{t('exercises.mainMuscle')}</label>
          <select
            id={`${uid}-mus`} value={muscle} onChange={e => setMuscle(e.target.value)}
            className="form-input form-input-dark"
          >
            {muscles.map(m => <option key={m} value={m}>{label('muscles', m)}</option>)}
          </select>
        </div>

        <div>
          <p id={`${uid}-sec`} className="form-label">
            {t('exercises.secondaryMuscles')} <span className="font-normal text-neutral-400">({t('exercises.secondaryMusclesHint')})</span>
          </p>
          {chips(`${uid}-sec`, secondaryOptions, v => secondary.includes(v), toggleSecondary, v => label('muscles', v))}
        </div>

        <div>
          <p id={`${uid}-dif`} className="form-label">{t('exercises.difficulty')}</p>
          {chips(`${uid}-dif`, EXERCISE_DIFFICULTIES, v => difficulty === v, setDifficulty, v => label('difficulty', v))}
        </div>

        {error && <p role="alert" className="text-xs font-semibold text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={saving || !name.trim()} className="btn-primary flex-1 disabled:opacity-50">
            {saving
              ? t('common.saving')
              : mode === 'copy' ? t('routineImport.edit.saveAsOwn') : t('routineImport.edit.save')}
          </button>
          <button type="button" onClick={onClose} disabled={saving} className="btn-ghost-dark">
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </GlowCard>
  )
}
