// Estado de borrador de la importación (paso "Revisar") y su conversión a rutinas.
// Todo puro: la pantalla solo pinta y llama a estas funciones.

import type { CreateRoutinePayload, SetPlanEntry } from '../../types/routine'
import { buildPlan, swapPlan } from '../setPlan'
import { buildMatchIndex, matchExercise, type CatalogItem, type MatchIndex } from './match'
import type { ParseResult, RowWarning } from './parse'

export interface DraftExercise extends CatalogItem {
  category: string
  muscle_group: string
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
}

export interface DraftDay {
  key: string
  name: string
  rows: DraftRow[]
}

export const IMPORT_DESCRIPTION = 'Importada'

let counter = 0
const nextKey = (prefix: string) => `${prefix}-${++counter}`

export function buildDraft(parsed: ParseResult, catalog: DraftExercise[], index?: MatchIndex<DraftExercise>): DraftDay[] {
  const idx = index ?? buildMatchIndex(catalog)
  return parsed.days.map(day => ({
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
      }
    }),
  }))
}

export function summarize(days: DraftDay[]): { matched: number; pending: number; total: number } {
  const rows = days.flatMap(d => d.rows)
  const matched = rows.filter(r => r.exercise).length
  return { matched, pending: rows.length - matched, total: rows.length }
}

/** Se puede guardar si hay filas, todas resueltas, y cada día tiene nombre y al menos una fila. */
export function canSave(days: DraftDay[]): boolean {
  if (days.length === 0) return false
  return days.every(d => d.name.trim() !== '' && d.rows.length > 0 && d.rows.every(r => r.exercise !== null))
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
