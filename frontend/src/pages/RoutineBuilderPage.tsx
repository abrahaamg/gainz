import { useEffect, useState, useCallback } from 'react'
import { cap } from '../lib/utils'
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
import { apiErrorMessage } from '../utils/apiError'
import { label } from '../utils/labels'
import { RoutineExerciseForm, SetPlanEntry } from '../types/routine'
import { Exercise } from '../types/exercise'
import useDebounce from '../hooks/useDebounce'
import GlowCard from '../components/ui/GlowCard'
import PageHeader from '../components/ui/PageHeader'
import SetPlanEditor from '../components/routines/SetPlanEditor'
import ExercisePickerModal from '../components/routines/ExercisePickerModal'
import { useExerciseCatalog } from '../hooks/useExerciseCatalog'
import { planFromExercise } from '../utils/setPlan'
import { exerciseSummary } from '../utils/reorder'

// ─── Estimated duration ───────────────────────────────────────
function calcDuration(exercises: RoutineExerciseForm[]): number {
  const secs = exercises.reduce((acc, ex) => {
    if (ex.duration_seconds) return acc + ex.sets * (ex.duration_seconds + ex.rest_seconds)
    const plan = ex.set_plan ?? []
    if (plan.length === 0) return acc + ex.sets * ((ex.reps ?? 10) * 3 + ex.rest_seconds)
    return acc + plan.reduce((sum, s) => sum + (s.reps ?? 10) * 3 + ex.rest_seconds, 0)
  }, 0)
  return Math.round(secs / 60)
}

const toolBtn =
  'flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl border border-white/10 bg-white/5 text-xs text-neutral-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-white/5'

const CATEGORY_COLORS: Record<string, string> = {
  strength:    'bg-neutral-900 text-white',
  cardio:      'bg-red-500 text-white',
  hiit:        'bg-orange-500 text-white',
  flexibility: 'bg-green-600 text-white',
  balance:     'bg-purple-600 text-white',
}

// ─── Sortable exercise card ───────────────────────────────────
// Plegada: asa + nº + nombre + resumen. Desplegada: acciones, series, descanso y nota.
function SortableExerciseCard({
  ex,
  index,
  count,
  open,
  onToggle,
  onChange,
  onPlanChange,
  onRemove,
  onMove,
  onChangeExercise,
  t,
}: {
  ex: RoutineExerciseForm
  index: number
  count: number
  open: boolean
  onToggle: (id: string) => void
  onChange: (id: string, field: keyof RoutineExerciseForm, value: unknown) => void
  onPlanChange: (id: string, plan: SetPlanEntry[]) => void
  onRemove: (id: string) => void
  onMove: (id: string, delta: -1 | 1) => void
  onChangeExercise: (id: string) => void
  t: (key: string, opts?: Record<string, unknown>) => string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: ex.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  const panelId = `ex-panel-${ex.id}`
  const summary = exerciseSummary(ex, t('common.sets'))

  return (
    <div ref={setNodeRef} style={style}>
      <GlowCard>
        <div className="flex items-center gap-1 py-2 pl-2 pr-3">
          {/* Asa: solo desde aquí se arrastra, para no pelearse con el scroll en el móvil */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="flex h-11 w-9 shrink-0 cursor-grab touch-none items-center justify-center text-lg text-neutral-400 hover:text-accent active:cursor-grabbing"
            aria-label={t('routines.drag')}
          >
            <i aria-hidden="true" className="bi bi-grip-vertical" />
          </button>

          <button
            type="button"
            onClick={() => onToggle(ex.id)}
            aria-expanded={open}
            aria-controls={panelId}
            className="flex min-h-[44px] min-w-0 flex-1 items-center gap-3 text-left"
          >
            <span className="w-5 shrink-0 text-center text-sm font-bold tabular-nums text-accent">{index + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold text-white">{ex.exercise_name}</span>
              <span className="block truncate text-xs text-neutral-400">
                {summary} · {label('muscles', ex.muscle_group)}
              </span>
            </span>
            <i aria-hidden="true" className={`bi bi-chevron-down inline-block shrink-0 text-neutral-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {open && (
          <div id={panelId} className="space-y-4 border-t border-white/10 px-4 pb-4 pt-3">
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => onMove(ex.id, -1)}
                disabled={index === 0}
                aria-label={t('routines.moveUp', { name: ex.exercise_name })}
                className={toolBtn}
              ><i aria-hidden="true" className="bi bi-arrow-up" /><span>{t('routines.moveUpShort')}</span></button>
              <button
                type="button"
                onClick={() => onMove(ex.id, 1)}
                disabled={index === count - 1}
                aria-label={t('routines.moveDown', { name: ex.exercise_name })}
                className={toolBtn}
              ><i aria-hidden="true" className="bi bi-arrow-down" /><span>{t('routines.moveDownShort')}</span></button>
              <button
                type="button"
                onClick={() => onChangeExercise(ex.id)}
                aria-label={t('routines.changeExercise', { name: ex.exercise_name })}
                className={toolBtn}
              ><i aria-hidden="true" className="bi bi-arrow-left-right" /><span>{t('routines.changeShort')}</span></button>
              <button
                type="button"
                onClick={() => onRemove(ex.id)}
                aria-label={t('routines.removeExercise', { name: ex.exercise_name })}
                className={`${toolBtn} !text-red-400 hover:!bg-red-500/10`}
              ><i aria-hidden="true" className="bi bi-trash3" /><span>{t('routines.removeShort')}</span></button>
            </div>

            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${CATEGORY_COLORS[ex.category] ?? 'bg-white/10 text-neutral-300'}`}>
              {label('categories', ex.category)}
            </span>

            {/* Series: una fila por serie (reps y peso); ejercicios por tiempo conservan series + duración */}
            {ex.set_plan ? (
              <SetPlanEditor
                plan={ex.set_plan}
                onChange={plan => onPlanChange(ex.id, plan)}
                idPrefix={`ex-${ex.id}`}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`sets-${ex.id}`} className="form-label">{cap(t('common.sets'))}</label>
                  <input
                    id={`sets-${ex.id}`}
                    type="number" min={1} max={20} inputMode="numeric"
                    value={ex.sets}
                    onChange={e => onChange(ex.id, 'sets', Number(e.target.value))}
                    className="form-input form-input-dark text-center tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor={`dur-${ex.id}`} className="form-label">{t('routines.duration')}</label>
                  <input
                    id={`dur-${ex.id}`}
                    type="number" min={1} inputMode="numeric"
                    value={ex.duration_seconds ?? ''}
                    onChange={e => onChange(ex.id, 'duration_seconds', Number(e.target.value))}
                    className="form-input form-input-dark text-center tabular-nums"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-[7rem_1fr] items-end gap-3">
              <div>
                <label htmlFor={`rest-${ex.id}`} className="form-label">{t('routines.restSeconds')}</label>
                <input
                  id={`rest-${ex.id}`}
                  type="number" min={0} step={5} inputMode="numeric"
                  value={ex.rest_seconds}
                  onChange={e => onChange(ex.id, 'rest_seconds', Number(e.target.value))}
                  className="form-input form-input-dark text-center tabular-nums"
                />
              </div>
              <div className="min-w-0">
                <label htmlFor={`note-${ex.id}`} className="form-label">{t('routines.noteShort')}</label>
                <input
                  id={`note-${ex.id}`}
                  type="text"
                  value={ex.notes}
                  onChange={e => onChange(ex.id, 'notes', e.target.value)}
                  placeholder={t('routines.routineNotePlaceholder')}
                  className="form-input form-input-dark"
                />
              </div>
            </div>
          </div>
        )}
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
  const [openIds, setOpenIds]         = useState<Set<string>>(new Set())
  const toggleOpen = useCallback((clientId: string) => {
    setOpenIds(prev => {
      const next = new Set(prev)
      if (next.has(clientId)) next.delete(clientId)
      else next.add(clientId)
      return next
    })
  }, [])

  // Exercise search
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch               = useDebounce(searchQuery, 300)
  const [searchResults, setSearchResults] = useState<Exercise[]>([])
  const [searching, setSearching]     = useState(false)

  const [swapId, setSwapId]           = useState<string | null>(null)
  const { catalog, loading: catalogLoading, error: catalogError, reload: reloadCatalog } = useExerciseCatalog()

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
      setIsPublic(Boolean(r.is_public))
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
          // Por duración no hay plan por serie; el resto siempre se edita serie a serie
          set_plan: ex.duration_seconds !== null ? null : planFromExercise(ex),
          notes: ex.notes ?? '',
          superset_group: ex.superset_group,
          exercise_name: ex.exercise_name,
          category: ex.category,
          muscle_group: ex.muscle_group,
        }))
      )
    }).catch(() => setError(t('routines.routineNotFound')))
  }, [id, isEdit, t])

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
      set_plan: Array.from({ length: 3 }, () => ({ reps: 10, weight_kg: null })),
      notes: '',
      superset_group: null,
      exercise_name: ex.name,
      category: ex.category,
      muscle_group: ex.muscle_group,
    }
    setExercises(prev => [...prev, newEx])
    setOpenIds(prev => new Set(prev).add(newEx.id))
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

  const updatePlan = useCallback((clientId: string, plan: SetPlanEntry[]) => {
    setExercises(prev => prev.map(ex => ex.id === clientId
      ? { ...ex, set_plan: plan, sets: plan.length, reps: plan[0]?.reps ?? null, weight_suggestion: plan[0]?.weight_kg ?? null }
      : ex))
  }, [])

  const moveExercise = useCallback((clientId: string, delta: -1 | 1) => {
    setExercises(prev => {
      const from = prev.findIndex(e => e.id === clientId)
      const to = from + delta
      if (from < 0 || to < 0 || to >= prev.length) return prev
      return arrayMove(prev, from, to).map((ex, i) => ({ ...ex, order_index: i }))
    })
  }, [])

  // Cambiar un ejercicio por otro conserva series, reps, peso, descanso y notas
  const replaceExercise = useCallback((clientId: string, next: Exercise) => {
    setExercises(prev => prev.map(ex => ex.id === clientId
      ? { ...ex, exercise_id: next.id, exercise_name: next.name, category: next.category, muscle_group: next.muscle_group }
      : ex))
  }, [])

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
          set_plan: ex.set_plan,
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
    } catch (err: unknown) {
      setError(apiErrorMessage(err, t('routines.saveError')))
    } finally {
      setSaving(false)
    }
  }

  const estimatedDuration = calcDuration(exercises)

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={isEdit ? t('routines.editRoutine') : t('routines.newRoutine')}
        actions={
          <button type="button" onClick={() => navigate('/routines')} className="btn-ghost-dark">
            <i aria-hidden="true" className="bi bi-arrow-left mr-1.5" />{t('nav.routines')}
          </button>
        }
      />

      {/* ── Metadata ── */}
      <GlowCard className="mb-6">
        <section className="p-6 space-y-5">
        <h2 className="text-sm font-bold text-white">{t('routines.generalInfo')}</h2>

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
        <h2 className="text-sm font-bold text-white mb-4">{t('routines.addExercises')}</h2>
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
                    <span className="text-neutral-400 ml-2 text-xs">{label('muscles', ex.muscle_group)}</span>
                  </span>
                  <span className="text-accent font-bold text-xs">{t('exercises.add')}</span>
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
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-neutral-400">
              {cap(t('common.exercises'))} ({exercises.length})
            </h2>
            <button
              type="button"
              onClick={() => setOpenIds(openIds.size === exercises.length ? new Set() : new Set(exercises.map(e => e.id)))}
              className="min-h-[44px] px-2 text-xs font-semibold text-accent-text dark:text-accent"
            >
              {openIds.size === exercises.length ? t('routines.collapseAll') : t('routines.expandAll')}
            </button>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={exercises.map(e => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {exercises.map((ex, i) => (
                  <SortableExerciseCard
                    key={ex.id}
                    ex={ex}
                    index={i}
                    count={exercises.length}
                    open={openIds.has(ex.id)}
                    onToggle={toggleOpen}
                    onChange={updateExercise}
                    onPlanChange={updatePlan}
                    onRemove={removeExercise}
                    onMove={moveExercise}
                    onChangeExercise={setSwapId}
                    t={t}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      )}

      <ExercisePickerModal
        open={swapId !== null}
        onClose={() => setSwapId(null)}
        title={t('routines.changeExerciseTitle')}
        catalog={catalog}
        loading={catalogLoading}
        error={Boolean(catalogError)}
        onRetry={reloadCatalog}
        onSelect={next => {
          if (swapId) replaceExercise(swapId, next)
          setSwapId(null)
        }}
      />

      {/* ── Footer ── */}
      <GlowCard className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-4 z-50">
        <div className="flex items-center gap-2 p-2 sm:gap-4 sm:p-4">
          <div className="min-w-0 flex-1 pl-2 text-xs font-medium leading-tight text-neutral-400">
            {exercises.length > 0 && (
              <p><i aria-hidden="true" className="bi bi-clock mr-1" /><span className="sr-only sm:not-sr-only">{t('routines.estimatedDuration')} </span><strong className="text-accent tabular-nums">{estimatedDuration} {t('common.min')}</strong></p>
            )}
            {error && <p role="alert" className="mt-1 text-sm text-red-400">{error}</p>}
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => navigate('/routines')}
              className="btn-ghost-dark px-4"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary px-5 disabled:opacity-50"
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </div>
      </GlowCard>
    </div>
  )
}
