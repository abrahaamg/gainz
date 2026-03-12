import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { routineService } from '../services/routineService'
import { exerciseService } from '../services/exerciseService'
import { RoutineExerciseForm } from '../types/routine'
import { Exercise } from '../types/exercise'
import useDebounce from '../hooks/useDebounce'

// ─── Estimated duration ───────────────────────────────────────
function calcDuration(exercises: RoutineExerciseForm[]): number {
  const secs = exercises.reduce((acc, ex) => {
    const workTime = ex.duration_seconds
      ? ex.duration_seconds
      : (ex.reps ?? 10) * 3
    return acc + ex.sets * (workTime + ex.rest_seconds)
  }, 0)
  return Math.round(secs / 60)
}

// ─── Sortable exercise card ───────────────────────────────────
function SortableExerciseCard({
  ex,
  onChange,
  onRemove,
}: {
  ex: RoutineExerciseForm
  onChange: (id: string, field: keyof RoutineExerciseForm, value: unknown) => void
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: ex.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const CATEGORY_COLORS: Record<string, string> = {
    strength:    'bg-blue-100 text-blue-800',
    cardio:      'bg-red-100 text-red-800',
    hiit:        'bg-orange-100 text-orange-800',
    flexibility: 'bg-green-100 text-green-800',
    balance:     'bg-purple-100 text-purple-800',
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
          aria-label="Arrastrar"
        >
          ⠿
        </button>

        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-gray-900">{ex.exercise_name}</p>
              <div className="flex gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[ex.category] ?? 'bg-gray-100 text-gray-600'}`}>
                  {ex.category}
                </span>
                <span className="text-xs text-gray-400">{ex.muscle_group}</span>
              </div>
            </div>
            <button onClick={() => onRemove(ex.id)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Series</label>
              <input
                type="number" min={1} max={20}
                value={ex.sets}
                onChange={e => onChange(ex.id, 'sets', Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                {ex.duration_seconds !== null ? 'Duración (s)' : 'Reps'}
              </label>
              {ex.duration_seconds !== null ? (
                <input
                  type="number" min={1}
                  value={ex.duration_seconds}
                  onChange={e => onChange(ex.id, 'duration_seconds', Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center"
                />
              ) : (
                <input
                  type="number" min={1} max={200}
                  value={ex.reps ?? 10}
                  onChange={e => onChange(ex.id, 'reps', Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center"
                />
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Descanso (s)</label>
              <input
                type="number" min={0} step={5}
                value={ex.rest_seconds}
                onChange={e => onChange(ex.id, 'rest_seconds', Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Peso sugerido (kg)</label>
              <input
                type="number" min={0} step={0.5}
                value={ex.weight_suggestion ?? ''}
                onChange={e => onChange(ex.id, 'weight_suggestion', e.target.value ? Number(e.target.value) : null)}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center"
                placeholder="—"
              />
            </div>
          </div>

          {/* Nota NIVEL 2: del creador de la rutina para este ejercicio */}
          <div className="mt-3">
            <label className="text-xs text-gray-500 block mb-1">Nota de rutina (instrucción para el ejercicio)</label>
            <input
              type="text"
              value={ex.notes}
              onChange={e => onChange(ex.id, 'notes', e.target.value)}
              placeholder='ej. "Agarre ancho, baja controlado"'
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main builder ─────────────────────────────────────────────
export default function RoutineBuilderPage() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  // Metadata
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [goal, setGoal]               = useState('')
  const [difficulty, setDifficulty]   = useState('medium')
  const [warmupNotes, setWarmupNotes] = useState('')
  const [cooldownNotes, setCooldownNotes] = useState('')
  const [isPublic, setIsPublic]       = useState(false)

  // Exercises in builder
  const [exercises, setExercises]     = useState<RoutineExerciseForm[]>([])

  // Exercise search
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch               = useDebounce(searchQuery, 300)
  const [searchResults, setSearchResults] = useState<Exercise[]>([])
  const [searching, setSearching]     = useState(false)

  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Load routine if editing
  useEffect(() => {
    if (!isEdit) return
    routineService.getById(Number(id)).then(r => {
      setName(r.name)
      setDescription(r.description ?? '')
      setGoal(r.goal ?? '')
      setDifficulty(r.difficulty)
      setWarmupNotes(r.warmup_notes ?? '')
      setCooldownNotes(r.cooldown_notes ?? '')
      setIsPublic(r.is_public)
      setExercises(
        (r.exercises ?? []).map(ex => ({
          id: String(ex.re_id),
          exercise_id: ex.exercise_id,
          order_index: ex.order_index,
          sets: ex.sets,
          reps: ex.reps,
          duration_seconds: ex.duration_seconds,
          rest_seconds: ex.rest_seconds,
          weight_suggestion: ex.weight_suggestion,
          notes: ex.notes ?? '',
          superset_group: ex.superset_group,
          exercise_name: ex.exercise_name,
          category: ex.category,
          muscle_group: ex.muscle_group,
        }))
      )
    })
  }, [id, isEdit])

  // Search exercises
  useEffect(() => {
    if (!debouncedSearch.trim()) { setSearchResults([]); return }
    setSearching(true)
    exerciseService.getAll({ q: debouncedSearch, limit: 8 })
      .then(res => setSearchResults(res.data))
      .finally(() => setSearching(false))
  }, [debouncedSearch])

  const addExercise = useCallback((ex: Exercise) => {
    // skip if already added
    if (exercises.some(e => e.exercise_id === ex.id)) return
    const newEx: RoutineExerciseForm = {
      id: `${ex.id}-${Date.now()}`,
      exercise_id: ex.id,
      order_index: exercises.length,
      sets: 3,
      reps: 10,
      duration_seconds: null,
      rest_seconds: 60,
      weight_suggestion: null,
      notes: '',
      superset_group: null,
      exercise_name: ex.name,
      category: ex.category,
      muscle_group: ex.muscle_group,
    }
    setExercises(prev => [...prev, newEx])
    setSearchQuery('')
    setSearchResults([])
  }, [exercises])

  const updateExercise = useCallback(
    (clientId: string, field: keyof RoutineExerciseForm, value: unknown) => {
      setExercises(prev =>
        prev.map(ex => ex.id === clientId ? { ...ex, [field]: value } : ex)
      )
    }, []
  )

  const removeExercise = useCallback((clientId: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== clientId))
  }, [])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setExercises(prev => {
        const oldIdx = prev.findIndex(e => e.id === active.id)
        const newIdx = prev.findIndex(e => e.id === over.id)
        return arrayMove(prev, oldIdx, newIdx).map((ex, i) => ({ ...ex, order_index: i }))
      })
    }
  }

  const handleSave = async () => {
    if (!name.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true)
    setError(null)
    try {
      const duration = calcDuration(exercises)
      const payload = {
        name: name.trim(),
        description: description || null,
        goal: goal || null,
        difficulty,
        estimated_duration_min: duration || null,
        warmup_notes: warmupNotes || null,
        cooldown_notes: cooldownNotes || null,
        is_public: isPublic,
        tags: [],
        exercises: exercises.map((ex, i) => ({
          exercise_id: ex.exercise_id,
          order_index: i,
          sets: ex.sets,
          reps: ex.reps,
          duration_seconds: ex.duration_seconds,
          rest_seconds: ex.rest_seconds,
          weight_suggestion: ex.weight_suggestion,
          notes: ex.notes || null,
          superset_group: ex.superset_group,
        })),
      }
      if (isEdit) {
        await routineService.update(Number(id), payload)
      } else {
        await routineService.create(payload)
      }
      navigate('/routines')
    } catch {
      setError('Error al guardar la rutina')
    } finally {
      setSaving(false)
    }
  }

  const estimatedDuration = calcDuration(exercises)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {isEdit ? 'Editar rutina' : 'Nueva rutina'}
      </h1>

      {/* ── Metadata ── */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Información general</h2>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Nombre *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="ej. Rutina Pecho y Tríceps"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Descripción</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Objetivo</label>
            <select
              value={goal}
              onChange={e => setGoal(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Sin objetivo</option>
              <option value="strength">Fuerza</option>
              <option value="cardio">Cardio</option>
              <option value="weight_loss">Pérdida de peso</option>
              <option value="flexibility">Flexibilidad</option>
              <option value="general">General</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Dificultad</label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="easy">Fácil</option>
              <option value="medium">Media</option>
              <option value="hard">Difícil</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">🔥 Notas de calentamiento</label>
          <input
            value={warmupNotes}
            onChange={e => setWarmupNotes(e.target.value)}
            placeholder='ej. "5 minutos en cinta"'
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">❄️ Notas de enfriamiento</label>
          <input
            value={cooldownNotes}
            onChange={e => setCooldownNotes(e.target.value)}
            placeholder='ej. "Estirar 5 minutos"'
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={e => setIsPublic(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          Rutina pública
        </label>
      </section>

      {/* ── Exercise search ── */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-gray-700 mb-3">Añadir ejercicios</h2>
        <div className="relative">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar ejercicio..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          {searching && (
            <span className="absolute right-3 top-2.5 text-gray-400 text-sm">...</span>
          )}
        </div>

        {searchResults.length > 0 && (
          <ul className="mt-2 border border-gray-100 rounded-lg overflow-hidden shadow-sm">
            {searchResults.map(ex => (
              <li key={ex.id}>
                <button
                  onClick={() => addExercise(ex)}
                  className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition-colors flex justify-between items-center text-sm"
                >
                  <span>
                    <span className="font-medium text-gray-900">{ex.name}</span>
                    <span className="text-gray-400 ml-2">{ex.muscle_group}</span>
                  </span>
                  <span className="text-indigo-600 font-medium">+ Añadir</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Sortable exercise list ── */}
      {exercises.length > 0 && (
        <section className="mb-6">
          <h2 className="font-semibold text-gray-700 mb-3">
            Ejercicios ({exercises.length})
          </h2>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={exercises.map(e => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {exercises.map(ex => (
                  <SortableExerciseCard
                    key={ex.id}
                    ex={ex}
                    onChange={updateExercise}
                    onRemove={removeExercise}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      )}

      {/* ── Footer ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between sticky bottom-4">
        <div className="text-sm text-gray-500">
          {exercises.length > 0 && (
            <span>⏱ Duración estimada: <strong className="text-gray-800">{estimatedDuration} min</strong></span>
          )}
        </div>

        <div className="flex gap-3">
          {error && <p className="text-sm text-red-500 self-center">{error}</p>}
          <button
            onClick={() => navigate('/routines')}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-60 transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar rutina'}
          </button>
        </div>
      </div>
    </div>
  )
}
