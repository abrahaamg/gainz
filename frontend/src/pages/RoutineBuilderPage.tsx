import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
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
import GlowCard from '../components/ui/GlowCard'

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

const CATEGORY_COLORS: Record<string, string> = {
  strength:    'bg-neutral-900 text-white',
  cardio:      'bg-red-500 text-white',
  hiit:        'bg-orange-500 text-white',
  flexibility: 'bg-green-600 text-white',
  balance:     'bg-purple-600 text-white',
}

// ─── Sortable exercise card ───────────────────────────────────
function SortableExerciseCard({
  ex,
  onChange,
  onRemove,
  t,
}: {
  ex: RoutineExerciseForm
  onChange: (id: string, field: keyof RoutineExerciseForm, value: unknown) => void
  onRemove: (id: string) => void
  t: (key: string) => string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: ex.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <GlowCard>
        <div className="p-4 flex items-start gap-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-1 text-neutral-500 hover:text-accent cursor-grab active:cursor-grabbing text-lg"
          aria-label={t('routines.drag')}
        >
          <i className="bi bi-grip-vertical" />
        </button>

        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-black text-white">{ex.exercise_name}</p>
              <div className="flex gap-2 mt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-full ${CATEGORY_COLORS[ex.category] ?? 'bg-white/10 text-neutral-300'}`}>
                  {ex.category}
                </span>
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">{t(`muscles.${ex.muscle_group}`)}</span>
              </div>
            </div>
            <button onClick={() => onRemove(ex.id)} className="text-red-400 hover:text-red-300 text-lg leading-none font-bold">×</button>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            <div>
              <label className="form-label">{t('common.sets')}</label>
              <input
                type="number" min={1} max={20}
                value={ex.sets}
                onChange={e => onChange(ex.id, 'sets', Number(e.target.value))}
                className="form-input text-center"
              />
            </div>
            <div>
              <label className="form-label">
                {ex.duration_seconds !== null ? t('routines.duration') : t('common.reps')}
              </label>
              {ex.duration_seconds !== null ? (
                <input
                  type="number" min={1}
                  value={ex.duration_seconds}
                  onChange={e => onChange(ex.id, 'duration_seconds', Number(e.target.value))}
                  className="form-input text-center"
                />
              ) : (
                <input
                  type="number" min={1} max={200}
                  value={ex.reps ?? 10}
                  onChange={e => onChange(ex.id, 'reps', Number(e.target.value))}
                  className="form-input text-center"
                />
              )}
            </div>
            <div>
              <label className="form-label">{t('routines.restSeconds')}</label>
              <input
                type="number" min={0} step={5}
                value={ex.rest_seconds}
                onChange={e => onChange(ex.id, 'rest_seconds', Number(e.target.value))}
                className="form-input text-center"
              />
            </div>
            <div>
              <label className="form-label">{t('routines.weight')}</label>
              <input
                type="number" min={0} step={0.5}
                value={ex.weight_suggestion ?? ''}
                onChange={e => onChange(ex.id, 'weight_suggestion', e.target.value ? Number(e.target.value) : null)}
                className="form-input text-center"
                placeholder="—"
              />
            </div>
          </div>

          {/* Nota NIVEL 2 */}
          <div className="mt-3">
            <label className="form-label">{t('routines.routineNote')}</label>
            <input
              type="text"
              value={ex.notes}
              onChange={e => onChange(ex.id, 'notes', e.target.value)}
              placeholder={t('routines.routineNotePlaceholder')}
              className="form-input"
            />
          </div>
        </div>
        </div>
      </GlowCard>
    </div>
  )
}

// ─── Main builder ─────────────────────────────────────────────
export default function RoutineBuilderPage() {
  const { t } = useTranslation()
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
    if (!name.trim()) { setError(t('routines.nameRequired')); return }
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
      setError(t('routines.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const estimatedDuration = calcDuration(exercises)

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <button onClick={() => navigate('/routines')} className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-900 mb-8 block transition-colors">
        <i className="bi bi-arrow-left mr-1" />{t('nav.routines')}
      </button>

      <h1 className="page-title mb-8">
        {isEdit ? t('routines.editRoutine') : t('routines.newRoutine')}
      </h1>

      {/* ── Metadata ── */}
      <GlowCard className="mb-6">
        <section className="p-6 space-y-5">
        <h2 className="text-sm font-black text-white uppercase tracking-wider">{t('routines.generalInfo')}</h2>

        <div>
          <label className="form-label">{t('exercises.name')}</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t('routines.namePlaceholder')}
            className="form-input"
          />
        </div>

        <div>
          <label className="form-label">{t('routines.descriptionLabel')}</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="form-input resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">{t('routines.goal')}</label>
            <select value={goal} onChange={e => setGoal(e.target.value)} className="form-input">
              <option value="">{t('routines.noGoal')}</option>
              <option value="strength">{t('goals.strength')}</option>
              <option value="cardio">{t('categories.cardio')}</option>
              <option value="weight_loss">{t('goals.fat_loss')}</option>
              <option value="flexibility">{t('goals.flexibility')}</option>
              <option value="general">{t('goals.general_fitness')}</option>
            </select>
          </div>
          <div>
            <label className="form-label">{t('exercises.difficulty')}</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="form-input">
              <option value="easy">{t('difficulty.easy')}</option>
              <option value="medium">{t('difficulty.medium')}</option>
              <option value="hard">{t('difficulty.hard')}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="form-label">{t('routines.warmupNotes')}</label>
          <input
            value={warmupNotes}
            onChange={e => setWarmupNotes(e.target.value)}
            placeholder={t('routines.warmupPlaceholder')}
            className="form-input"
          />
        </div>

        <div>
          <label className="form-label">{t('routines.cooldownNotes')}</label>
          <input
            value={cooldownNotes}
            onChange={e => setCooldownNotes(e.target.value)}
            placeholder={t('routines.cooldownPlaceholder')}
            className="form-input"
          />
        </div>

        <label className="flex items-center gap-2.5 text-sm font-medium text-neutral-300 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={e => setIsPublic(e.target.checked)}
            className="w-4 h-4 accent-accent"
          />
          {t('routines.publicRoutine')}
        </label>
        </section>
      </GlowCard>

      {/* ── Exercise search ── */}
      <GlowCard className="mb-6">
        <section className="p-6">
        <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4">{t('routines.addExercises')}</h2>
        <div className="relative">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('routines.searchExercise')}
            className="form-input"
          />
          {searching && (
            <span className="absolute right-3 top-3 text-neutral-400 text-sm">...</span>
          )}
        </div>

        {searchResults.length > 0 && (
          <ul className="mt-2 border border-white/10 rounded-2xl overflow-hidden bg-black/30">
            {searchResults.map(ex => (
              <li key={ex.id}>
                <button
                  onClick={() => addExercise(ex)}
                  className="w-full text-left px-4 py-2.5 hover:bg-accent/10 transition-colors flex justify-between items-center text-sm border-b border-white/5 last:border-0"
                >
                  <span>
                    <span className="font-bold text-white">{ex.name}</span>
                    <span className="text-neutral-500 ml-2 text-[11px] uppercase tracking-wider">{t(`muscles.${ex.muscle_group}`)}</span>
                  </span>
                  <span className="text-accent font-black text-[11px] uppercase tracking-wider">{t('exercises.add')}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        </section>
      </GlowCard>

      {/* ── Sortable exercise list ── */}
      {exercises.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-black uppercase tracking-wider mb-4 text-neutral-700">
            {t('common.exercises')} ({exercises.length})
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
                    t={t}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      )}

      {/* ── Footer ── */}
      <GlowCard className="sticky bottom-4">
        <div className="p-4 flex items-center justify-between">
          <div className="text-sm text-neutral-400 font-medium">
            {exercises.length > 0 && (
              <span><i className="bi bi-clock mr-1" />{t('routines.estimatedDuration')} <strong className="text-accent">{estimatedDuration} {t('common.min')}</strong></span>
            )}
          </div>

          <div className="flex gap-3 items-center">
            {error && <p className="text-sm text-red-400 font-medium">{error}</p>}
            <button
              onClick={() => navigate('/routines')}
              className="btn-secondary"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? t('common.saving') : t('routines.saveRoutine')}
            </button>
          </div>
        </div>
      </GlowCard>
    </div>
  )
}
