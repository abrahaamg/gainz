import type { LastSet } from '../types/session'
import type { SetPlanEntry } from '../types/routine'

/**
 * Referencia de la última vez para la serie `setNumber`: la misma serie si existió,
 * si no la última entrada. null si no hay historial.
 */
export function lastSetFor(lastSets: LastSet[] | undefined | null, setNumber: number): LastSet | null {
  if (!lastSets || lastSets.length === 0) return null
  return lastSets.find(s => s.set_number === setNumber) ?? lastSets[lastSets.length - 1]
}

export interface SetHints {
  /** Valor que se enseña en gris en la casilla (última vez; si no hay, objetivo del plan). */
  repsPlaceholder: number | null
  weightPlaceholder: number | null
}

export function setHints(last: LastSet | null, target: SetPlanEntry | null): SetHints {
  return {
    repsPlaceholder: last?.reps_done ?? target?.reps ?? null,
    weightPlaceholder: last?.weight_kg ?? target?.weight_kg ?? null,
  }
}

function parseTyped(raw: string): number | null {
  if (raw.trim() === '') return null
  const n = Number(raw.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/** Valor a guardar: lo tecleado, o el placeholder si la casilla está vacía. */
export function resolveTyped(raw: string, placeholder: number | null): number | null {
  return parseTyped(raw) ?? placeholder
}

/** Punto de partida de los botones −/+: lo tecleado, o el placeholder, o 0. */
export function stepFrom(raw: string, placeholder: number | null, delta: number): number {
  const base = parseTyped(raw) ?? placeholder ?? 0
  return Math.max(0, Math.round((base + delta) * 100) / 100)
}

/** "20 kg × 10" (o solo una de las partes). null si no hay ninguna. */
export function formatSetRef(reps: number | null, weight: number | null): string | null {
  const r = reps !== null ? String(reps) : null
  const w = weight !== null ? `${Math.round(weight * 100) / 100} kg` : null
  if (r && w) return `${w} × ${r}`
  return w ?? r
}
