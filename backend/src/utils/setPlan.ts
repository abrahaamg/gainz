import { CreateRoutineExerciseDTO, SetPlanEntry } from '../types/entities/Routine'

/**
 * Con plan por serie, sets/reps/weight_suggestion salen del plan (la primera
 * serie hace de valor por defecto para quien no lea set_plan). Sin plan, el
 * ejercicio se queda como llega y set_plan pasa a null.
 */
export const applySetPlan = (ex: CreateRoutineExerciseDTO): CreateRoutineExerciseDTO => {
  const plan = ex.set_plan
  if (!plan || plan.length === 0) return { ...ex, set_plan: null }
  return {
    ...ex,
    sets: plan.length,
    reps: plan[0].reps,
    weight_suggestion: plan[0].weight_kg,
    set_plan: plan,
  }
}

const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/**
 * El driver puede devolver la columna JSON ya parseada o como texto (según
 * MySQL/TiDB). Devuelve siempre un array de series o null.
 */
export const parseSetPlan = (raw: unknown): SetPlanEntry[] | null => {
  const value = typeof raw === 'string' ? JSON.parse(raw) : raw
  if (!Array.isArray(value) || value.length === 0) return null
  return value.map((entry: Record<string, unknown> | null) => ({
    reps: toNumberOrNull(entry?.reps),
    weight_kg: toNumberOrNull(entry?.weight_kg),
  }))
}
