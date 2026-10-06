// Estado de borrador de la importación (paso "Revisar") y su conversión a rutinas.
// Todo puro: la pantalla solo pinta y llama a estas funciones.

import type { CreateRoutinePayload, SetPlanEntry } from '../../types/routine'
import { buildPlan, swapPlan } from '../setPlan'
import { buildMatchIndex, matchExercise, type CatalogItem, type MatchIndex } from './match'
import type { ParseResult, RowWarning } from './parse'

export interface DraftExercise extends CatalogItem {
  category: string
  muscle_group: string
  /** Dueño del ejercicio. null/ausente = catálogo público. */
  created_by?: number | null
  secondary_muscles?: string[]
  difficulty?: string
}

export interface DraftRow {
  key: string
  rawName: string
  /** Ejercicio elegido (emparejado solo o a mano). null = sin resolver. */
  exercise: DraftExercise | null
  /** Sugerencias para filas sin resolver. */
  suggestions: DraftExercise[]
  plan: SetPlanEntry[]
  notes: string
  warnings: RowWarning[]
  /** Índice de la tabla pegada de la que viene (para volver al modo "un día por tabla"). */
  source: number
  /** true si el usuario ha elegido el día a mano: el reparto automático ya no lo toca. */
  manual?: boolean
}

export interface DraftDay {
  key: string
  name: string
  rows: DraftRow[]
  /** Plan semanal: día que no se importa. */
  skipped?: boolean
  /** Plan semanal: cajón "Sin asignar" (no es una rutina). */
  unassigned?: boolean
}

export const IMPORT_DESCRIPTION = 'Importada'

let counter = 0
const nextKey = (prefix: string) => `${prefix}-${++counter}`

export function buildDraft(parsed: ParseResult, catalog: DraftExercise[], index?: MatchIndex<DraftExercise>): DraftDay[] {
  const idx = index ?? buildMatchIndex(catalog)
  return parsed.days.map((day, source) => ({
    key: nextKey('day'),
    name: day.name,
    rows: day.rows.map(row => {
      const m = matchExercise(row.rawName, idx)
      return {
        key: nextKey('row'),
        rawName: row.rawName,
        exercise: m.status === 'matched' ? m.best : null,
        suggestions: m.status === 'matched' ? [] : [m.best, ...m.alternatives].filter((x): x is DraftExercise => x !== null),
        plan: buildPlan(row.sets, row.reps, row.weights),
        notes: row.notes,
        warnings: row.warnings,
        source,
      }
    }),
  }))
}

export function summarize(days: DraftDay[]): { matched: number; pending: number; total: number } {
  const rows = days.filter(d => !d.skipped).flatMap(d => d.rows)
  const matched = rows.filter(r => r.exercise).length
  return { matched, pending: rows.length - matched, total: rows.length }
}

/** Días que se convertirán en rutina: sin los omitidos, sin el cajón "Sin asignar" y (opcional) sin los vacíos. */
export function daysToSave(days: DraftDay[], dropEmpty = false): DraftDay[] {
  return days.filter(d => !d.skipped && !d.unassigned && (!dropEmpty || d.rows.length > 0))
}

/**
 * Se puede guardar si hay algo que guardar, nada queda "Sin asignar", todas las filas están
 * resueltas y cada día tiene nombre (y filas, salvo que `dropEmpty` ignore los vacíos o `allowEmpty`
 * deje crear rutinas vacías para rellenarlas después).
 */
export function canSave(days: DraftDay[], dropEmpty = false, allowEmpty = false): boolean {
  if (days.some(d => d.unassigned && d.rows.length > 0)) return false
  const list = daysToSave(days, dropEmpty)
  if (list.length === 0) return false
  return list.every(d => d.name.trim() !== '' && (allowEmpty || d.rows.length > 0) && d.rows.every(r => r.exercise !== null))
}

export function swapRow(row: DraftRow): DraftRow {
  return { ...row, plan: swapPlan(row.plan), warnings: row.warnings.filter(w => w !== 'swapped') }
}

export function dismissWarning(row: DraftRow, warning: RowWarning): DraftRow {
  return { ...row, warnings: row.warnings.filter(w => w !== warning) }
}

export function moveRow(day: DraftDay, from: number, to: number): DraftDay {
  if (to < 0 || to >= day.rows.length || from === to) return day
  const rows = [...day.rows]
  const [item] = rows.splice(from, 1)
  rows.splice(to, 0, item)
  return { ...day, rows }
}

export function moveRowToDay(days: DraftDay[], fromDay: number, rowIndex: number, toDay: number): DraftDay[] {
  if (fromDay === toDay || !days[fromDay] || !days[toDay]) return days
  const row = days[fromDay].rows[rowIndex]
  if (!row) return days
  return days.map((d, i) => {
    if (i === fromDay) return { ...d, rows: d.rows.filter((_, j) => j !== rowIndex) }
    if (i === toDay) return { ...d, rows: [...d.rows, row] }
    return d
  })
}

/** Rutina (payload de `routineService.create`) de un día. Reps/peso por serie en `set_plan`. */
export function dayToPayload(day: DraftDay): CreateRoutinePayload {
  return {
    name: day.name.trim(),
    description: IMPORT_DESCRIPTION,
    difficulty: 'medium',
    is_public: false,
    tags: [],
    exercises: day.rows.map((row, i) => {
      const first = row.plan[0]
      return {
        exercise_id: row.exercise!.id,
        order_index: i,
        sets: row.plan.length,
        reps: first?.reps ?? null,
        duration_seconds: null,
        rest_seconds: 90,
        weight_suggestion: first?.weight_kg ?? null,
        set_plan: row.plan,
        notes: row.notes.trim() || null,
        superset_group: null,
      }
    }),
  }
}
