import { arrayMove } from '@dnd-kit/sortable'
import type { CreateRoutinePayload, RoutineExercise } from '../types/routine'
import { planFromExercise } from './setPlan'

/**
 * Mueve el elemento `activeId` a la posición de `overId` (como al soltar en dnd-kit).
 * Si no cambia nada devuelve la misma lista.
 */
export function moveItem<T>(list: T[], getId: (item: T) => number | string, activeId: number | string, overId: number | string | undefined): T[] {
  if (overId === undefined || activeId === overId) return list
  const from = list.findIndex(item => getId(item) === activeId)
  const to = list.findIndex(item => getId(item) === overId)
  if (from < 0 || to < 0) return list
  return arrayMove(list, from, to)
}

/**
 * Ejercicios para PUT /routines/:id tras reordenar: order_index según su posición
 * y el resto de datos tal cual (plan por serie, descanso, notas, superseries).
 */
export function exercisesReorderPayload(exercises: RoutineExercise[]): CreateRoutinePayload['exercises'] {
  return exercises.map((ex, i) => ({
    exercise_id: ex.exercise_id,
    order_index: i,
    sets: ex.sets,
    reps: ex.reps,
    duration_seconds: ex.duration_seconds,
    rest_seconds: ex.rest_seconds,
    weight_suggestion: ex.weight_suggestion,
    set_plan: ex.set_plan,
    notes: ex.notes,
    superset_group: ex.superset_group,
  }))
}

/**
 * Línea corta de un ejercicio: "4 series · 10-9-8-7", "3 series · 12" si todas
 * las series piden lo mismo, o "3 series · 30 s" si es por tiempo.
 */
export function exerciseSummary(
  ex: Pick<RoutineExercise, 'sets' | 'reps' | 'weight_suggestion' | 'duration_seconds' | 'set_plan'>,
  setsWord: string,
): string {
  const sets = `${ex.sets} ${setsWord}`
  if (ex.duration_seconds !== null) return `${sets} · ${ex.duration_seconds} s`
  const reps = planFromExercise(ex).map(s => s.reps)
  if (reps.every(r => r === null)) return sets
  const unique = new Set(reps)
  const text = unique.size === 1 ? String(reps[0]) : reps.map(r => r ?? '?').join('-')
  return `${sets} · ${text}`
}
