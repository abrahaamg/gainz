import type { SetPlanEntry } from '../types/routine'

export const MAX_SETS = 20

interface PlanSource {
  set_plan?: SetPlanEntry[] | null
  sets: number
  reps: number | null
  weight_suggestion: number | null
}

/**
 * Plan por serie de un ejercicio. Si no tiene `set_plan` (rutinas antiguas),
 * repite `reps` y `weight_suggestion` en todas las series.
 */
export function planFromExercise(ex: PlanSource): SetPlanEntry[] {
  if (ex.set_plan && ex.set_plan.length > 0) return ex.set_plan.map(s => ({ ...s }))
  const n = Math.min(Math.max(ex.sets || 1, 1), MAX_SETS)
  return Array.from({ length: n }, () => ({ reps: ex.reps, weight_kg: ex.weight_suggestion }))
}

/** Objetivo de la serie `setNumber` (1-based). Se ajusta al rango si se pasa del plan. */
export function targetForSet(ex: PlanSource, setNumber: number): SetPlanEntry {
  const plan = planFromExercise(ex)
  return plan[Math.min(Math.max(setNumber, 1), plan.length) - 1]
}

/**
 * Plan a partir de listas por serie. Un valor único se repite en todas las series;
 * si una lista es más corta (y tiene >1 valor) se completa con su último valor.
 * El nº de series es el mayor entre `sets` y la longitud de las listas (sin perder datos).
 */
export function buildPlan(sets: number, reps: number[], weights: number[]): SetPlanEntry[] {
  const n = Math.min(Math.max(sets, reps.length, weights.length, 1), MAX_SETS)
  const pick = (list: number[], i: number): number | null => {
    if (list.length === 0) return null
    return list[Math.min(i, list.length - 1)]
  }
  return Array.from({ length: n }, (_, i) => ({ reps: pick(reps, i), weight_kg: pick(weights, i) }))
}

/** Intercambia reps y peso de cada serie (cuando se pegaron en la columna equivocada). */
export function swapPlan(plan: SetPlanEntry[]): SetPlanEntry[] {
  return plan.map(s => ({ reps: s.weight_kg, weight_kg: s.reps }))
}

/** Duplica la última serie (o crea una vacía). Respeta MAX_SETS. */
export function addSet(plan: SetPlanEntry[]): SetPlanEntry[] {
  if (plan.length >= MAX_SETS) return plan
  const last = plan[plan.length - 1]
  return [...plan, last ? { ...last } : { reps: null, weight_kg: null }]
}

/** Copia la serie `index - 1` sobre la serie `index`. */
export function copyPreviousSet(plan: SetPlanEntry[], index: number): SetPlanEntry[] {
  if (index <= 0 || index >= plan.length) return plan
  return plan.map((s, i) => (i === index ? { ...plan[index - 1] } : s))
}

export function removeSet(plan: SetPlanEntry[], index: number): SetPlanEntry[] {
  if (plan.length <= 1) return plan
  return plan.filter((_, i) => i !== index)
}

export function updateSet(plan: SetPlanEntry[], index: number, patch: Partial<SetPlanEntry>): SetPlanEntry[] {
  return plan.map((s, i) => (i === index ? { ...s, ...patch } : s))
}

function fmtNum(n: number): string {
  return String(Math.round(n * 100) / 100)
}

/** "S1 10×20 kg · S2 9×20 kg": resumen legible del plan. */
export function formatPlan(plan: SetPlanEntry[]): string {
  return plan
    .map((s, i) => {
      const reps = s.reps !== null ? fmtNum(s.reps) : null
      const kg = s.weight_kg !== null ? `${fmtNum(s.weight_kg)} kg` : null
      const body = reps && kg ? `${reps}×${kg}` : (reps ?? kg ?? '—')
      return `S${i + 1} ${body}`
    })
    .join(' · ')
}
