import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { exerciseService } from '../../services/exerciseService'
import { apiErrorMessage } from '../../utils/apiError'
import { label } from '../../utils/labels'
import type { Exercise, ExerciseCategory } from '../../types/exercise'

const CATEGORIES: ExerciseCategory[] = ['strength', 'cardio', 'flexibility', 'hiit', 'balance']
const MUSCLES = [
  'chest', 'lats', 'upper_back', 'quadriceps', 'hamstrings', 'glutes', 'calves',
  'shoulders', 'biceps', 'triceps', 'forearms', 'core', 'full_body',
]

interface Props {
  /** Nombre inicial (el original importado, ya con mayúsculas razonables). */
  initialName: string
  onCreated: (exercise: Exercise) => void
}

/** "Crear como ejercicio propio": nombre, categoría y músculo mínimos, con el servicio de ejercicios. */
export default function CreateOwnExercise({ initialName, onCreated }: Props) {
  const { t } = useTranslation()
  const uid = useId()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(initialName)
  const [category, setCategory] = useState<ExerciseCategory>('strength')
  const [muscle, setMuscle] = useState('chest')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      const created = await exerciseService.create({
        name: name.trim(),
        category,
        muscle_group: muscle,
        difficulty: 'medium',
        is_public: false,
      })
      onCreated(created)
    } catch (err) {
      setError(apiErrorMessage(err, t('routineImport.createError')))
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-ghost-dark w-full justify-center py-2.5 text-sm"
      >
        <i aria-hidden="true" className="bi bi-plus-lg mr-1.5" />{t('routineImport.createOwn')}
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm font-bold text-white">{t('routineImport.createOwn')}</p>
      <div>
        <label htmlFor={`${uid}-name`} className="form-label">{t('exercises.name')}</label>
        <input
          id={`${uid}-name`} value={name} onChange={e => setName(e.target.value)} required maxLength={150}
          className="form-input form-input-dark"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${uid}-cat`} className="form-label">{t('exercises.category')}</label>
          <select
            id={`${uid}-cat`} value={category} onChange={e => setCategory(e.target.value as ExerciseCategory)}
            className="form-input form-input-dark"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{label('categories', c)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${uid}-mus`} className="form-label">{t('exercises.muscle')}</label>
          <select
            id={`${uid}-mus`} value={muscle} onChange={e => setMuscle(e.target.value)}
            className="form-input form-input-dark"
          >
            {MUSCLES.map(m => <option key={m} value={m}>{label('muscles', m)}</option>)}
          </select>
        </div>
      </div>
      {error && <p role="alert" className="text-xs font-semibold text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving || !name.trim()} className="btn-primary flex-1 disabled:opacity-50">
          {saving ? t('common.saving') : t('routineImport.createAndUse')}
        </button>
        <button type="button" onClick={() => setOpen(false)} disabled={saving} className="btn-ghost-dark">
          {t('common.cancel')}
        </button>
      </div>
    </form>
  )
}
