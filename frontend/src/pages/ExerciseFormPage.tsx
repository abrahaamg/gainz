import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { exerciseService } from '../services/exerciseService'
import { ExerciseCategory, Difficulty, CreateExerciseDTO } from '../types/exercise'

const CATEGORIES: { value: ExerciseCategory; label: string }[] = [
  { value: 'strength', label: 'Fuerza' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'flexibility', label: 'Flexibilidad' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'balance', label: 'Equilibrio' },
]

const MUSCLE_GROUPS = [
  'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full_body',
]

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pecho', back: 'Espalda', legs: 'Piernas',
  shoulders: 'Hombros', arms: 'Brazos', core: 'Core', full_body: 'Cuerpo completo',
}

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Fácil' },
  { value: 'medium', label: 'Media' },
  { value: 'hard', label: 'Difícil' },
]

const EMPTY_FORM: CreateExerciseDTO = {
  name: '',
  category: 'strength',
  muscle_group: 'chest',
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
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [form, setForm] = useState<CreateExerciseDTO>(EMPTY_FORM)
  const [equipmentInput, setEquipmentInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEditing)
  const [error, setError] = useState<string | null>(null)

  // Si es edición, cargar datos existentes
  useEffect(() => {
    if (!isEditing || !id) return
    const fetch = async () => {
      try {
        const exercise = await exerciseService.getById(parseInt(id, 10))
        setForm({
          name: exercise.name,
          category: exercise.category,
          muscle_group: exercise.muscle_group,
          difficulty: exercise.difficulty,
          description: exercise.description ?? '',
          instructions: exercise.instructions ?? '',
          notes: exercise.notes ?? '',
          requires_equipment: exercise.requires_equipment,
          is_unilateral: exercise.is_unilateral,
          is_public: exercise.is_public,
          equipment: exercise.equipment ?? [],
        })
      } catch {
        setError('No se pudo cargar el ejercicio')
      } finally {
        setFetchLoading(false)
      }
    }
    fetch()
  }, [id, isEditing])

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
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return }
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
      const msg = err instanceof Error ? err.message : 'Error al guardar'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-1/2" />
        <div className="h-48 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => navigate('/exercises')} className="text-blue-600 hover:underline text-sm mb-6">
        ← Volver a ejercicios
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Editar ejercicio' : 'Nuevo ejercicio'}
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input
            type="text" required value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Ej: Press de Banca"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(({ value, label }) => (
              <button key={value} type="button"
                onClick={() => set('category', value)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  form.category === value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Músculo principal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Músculo principal *</label>
          <select
            value={form.muscle_group}
            onChange={(e) => set('muscle_group', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MUSCLE_GROUPS.map((m) => (
              <option key={m} value={m}>{MUSCLE_LABELS[m]}</option>
            ))}
          </select>
        </div>

        {/* Dificultad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dificultad</label>
          <div className="flex gap-2">
            {DIFFICULTIES.map(({ value, label }) => (
              <button key={value} type="button"
                onClick={() => set('difficulty', value)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  form.difficulty === value
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea rows={3} value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Breve descripción del ejercicio..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Instrucciones */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Instrucciones <span className="text-gray-400 font-normal">(una por línea)</span>
          </label>
          <textarea rows={5} value={form.instructions ?? ''}
            onChange={(e) => set('instructions', e.target.value)}
            placeholder="1. Primer paso&#10;2. Segundo paso&#10;3. Tercer paso"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Notas del creador — NIVEL 1 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas del creador <span className="text-gray-400 font-normal">(técnica, advertencias)</span>
          </label>
          <textarea rows={2} value={form.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Advertencias técnicas, errores comunes a evitar..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-6">
          {[
            { key: 'requires_equipment' as const, label: '🏋️ Requiere equipamiento' },
            { key: 'is_unilateral' as const, label: '🦵 Unilateral' },
            { key: 'is_public' as const, label: '🌍 Ejercicio público' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={Boolean(form[key])}
                onChange={(e) => set(key, e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>

        {/* Equipamiento requerido */}
        {form.requires_equipment && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipamiento necesario</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={equipmentInput}
                onChange={(e) => setEquipmentInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEquipment() } }}
                placeholder="Ej: barbell, dumbbell..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button type="button" onClick={addEquipment}
                className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm">
                + Añadir
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(form.equipment ?? []).map((eq) => (
                <span key={eq} className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  {eq}
                  <button type="button" onClick={() => removeEquipment(eq)}
                    className="ml-1 text-yellow-600 hover:text-red-600 font-bold leading-none">×</button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50">
            {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear ejercicio'}
          </button>
          <button type="button" onClick={() => navigate('/exercises')}
            className="px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
