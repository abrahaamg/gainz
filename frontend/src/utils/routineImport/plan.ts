// Reparto opcional de lo importado por músculo (tirón / empuje / pierna), días omitidos y aviso
// por nombres ya existentes. Todo puro: la pantalla solo pinta y llama a estas funciones.

import { normalizeName } from './match'
import { addDay, MAX_DAYS, UNASSIGNED_KEY } from './days'
import type { DraftDay, DraftExercise, DraftRow } from './draft'

export type SplitGroup = 'pull' | 'push' | 'legs'

/** Día (1-based) que se propone para cada grupo. */
export const GROUP_DAY: Record<SplitGroup, number> = { pull: 1, push: 2, legs: 3 }

const LEG_MUSCLES = new Set(['legs', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'])
const PUSH_MUSCLES = new Set(['chest', 'triceps'])
const PULL_MUSCLES = new Set(['back', 'lats', 'upper_back', 'biceps', 'forearms', 'traps'])

const PULL_NAME = /\b(pullover|remo|jalon|dominada|curl|predicador|martillo|bayesian|face pull|reverse|pajaro|posterior|rear|encogimiento|trapecio|antebrazo|muneca)\w*/
const PUSH_NAME = /\b(press|aperturas|peck|fondos|triceps|trasnuca|frances|extension|patada|elevaciones|flexiones|crossover|pecho|cruces)\w*/
const LEG_NAME = /\b(sentadilla|hack|prensa|femoral|cuadriceps|gemelo|aductor|aduccion|abductor|abduccion|gluteo|hip thrust|rumano|zancada|isquio|pierna)\w*/

/** Grupo de entrenamiento de un ejercicio del catálogo; null si no se puede clasificar (core, cuerpo completo…). */
export function classifyExercise(ex: Pick<DraftExercise, 'name' | 'muscle_group'>): SplitGroup | null {
  const mg = ex.muscle_group
  const name = normalizeName(ex.name)
  if (LEG_MUSCLES.has(mg)) return 'legs'
  if (mg === 'chest') return /\bpullover\b/.test(name) ? 'pull' : 'push'
  if (PUSH_MUSCLES.has(mg)) return 'push'
  if (PULL_MUSCLES.has(mg)) return 'pull'
  // El catálogo agrupa en "hombros" y "brazos": el nombre decide.
  if (mg === 'shoulders') return PULL_NAME.test(name) ? 'pull' : 'push'
  if (mg === 'arms') return /(muneca|antebrazo)\w*/.test(name) ? 'pull' : /\b(triceps|frances|fondos|press|extension|patada|banca)\b/.test(name) ? 'push' : 'pull'
  return null
}

/** Grupo de un nombre importado sin emparejar, por palabras clave. */
export function classifyRawName(raw: string): SplitGroup | null {
  const name = normalizeName(raw)
  if (LEG_NAME.test(name)) return 'legs'
  if (PULL_NAME.test(name)) return 'pull'
  if (PUSH_NAME.test(name)) return 'push'
  return null
}

/** Grupo de una fila (por su ejercicio o, sin emparejar, por su nombre original). */
export function classifyRow(row: Pick<DraftRow, 'exercise' | 'rawName'>): SplitGroup | null {
  return row.exercise ? classifyExercise(row.exercise) : classifyRawName(row.rawName)
}

/** El usuario elige día para una fila: queda marcada como manual. */
export function assignRowToDay(days: DraftDay[], rowKey: string, toKey: string): DraftDay[] {
  const from = days.find(d => d.rows.some(r => r.key === rowKey))
  const to = days.find(d => d.key === toKey)
  if (!from || !to || from === to) return days
  const row = from.rows.find(r => r.key === rowKey)!
  return days.map(d => {
    if (d === from) return { ...d, rows: d.rows.filter(r => r.key !== rowKey) }
    if (d === to) return { ...d, rows: [...d.rows, { ...row, manual: !to.unassigned }] }
    return d
  })
}

export function setDaySkipped(days: DraftDay[], dayKey: string, skipped: boolean): DraftDay[] {
  return days.map(d => (d.key === dayKey ? { ...d, skipped: skipped || undefined } : d))
}

export function unassignedCount(days: DraftDay[]): number {
  return days.filter(d => d.unassigned).reduce((n, d) => n + d.rows.length, 0)
}

// ── Reparto opcional por músculo

export interface SplitOptions {
  /** Cuántos días (los primeros de la lista) se usan; si faltan, se crean. */
  dayCount: number
  /** Día (1-based) de cada grupo. */
  groupDays: Record<SplitGroup, number>
}

export const DEFAULT_SPLIT: SplitOptions = { dayCount: 3, groupDays: { ...GROUP_DAY } }

/** Lo necesario para deshacer un reparto sin pisar lo que el usuario haya tocado después. */
export interface SplitUndo {
  /** Fila → día en el que estaba antes del reparto (solo las que se movieron). */
  origins: Record<string, string>
  /** Orden de filas de cada día antes del reparto. */
  order: Record<string, string[]>
  createdDayKeys: string[]
}

/**
 * Reparte por músculo las filas que NO se han movido a mano. Crea los días que falten hasta `dayCount`;
 * lo que no se puede clasificar va a "Sin asignar".
 */
export function splitByMuscle(days: DraftDay[], options: SplitOptions): { days: DraftDay[]; undo: SplitUndo } {
  const count = Math.min(MAX_DAYS, Math.max(1, Math.round(options.dayCount) || 1))
  const undo: SplitUndo = { origins: {}, order: {}, createdDayKeys: [] }
  for (const d of days) undo.order[d.key] = d.rows.map(r => r.key)

  let work = days
  while (work.filter(d => !d.unassigned).length < count) {
    const before = work.length
    work = addDay(work)
    if (work.length === before) break
    undo.createdDayKeys.push(work.filter(d => !d.unassigned).at(-1)!.key)
  }
  const real = work.filter(d => !d.unassigned)
  const target = (group: SplitGroup | null): string => {
    if (!group) return UNASSIGNED_KEY
    const n = Math.min(count, Math.max(1, Math.round(options.groupDays[group]) || 1))
    return real[n - 1]?.key ?? UNASSIGNED_KEY
  }

  const moves = new Map<string, string>()
  for (const d of work) {
    for (const row of d.rows) {
      if (row.manual) continue
      const to = target(classifyRow(row))
      if (to !== d.key) moves.set(row.key, to)
    }
  }
  if (moves.size === 0) return { days: work, undo }

  const moving = work.flatMap(d => d.rows.filter(r => moves.has(r.key)))
  for (const row of moving) undo.origins[row.key] = work.find(d => d.rows.includes(row))!.key
  const needUnassigned = [...moves.values()].includes(UNASSIGNED_KEY) && !work.some(d => d.unassigned)
  const base: DraftDay[] = needUnassigned ? [...work, { key: UNASSIGNED_KEY, name: '', rows: [], unassigned: true }] : work
  const next = base.map(d => ({
    ...d,
    rows: [
      ...d.rows.filter(r => !moves.has(r.key)),
      ...moving.filter(r => moves.get(r.key) === d.key).map(r => ({ ...r, manual: false })),
    ],
  }))
  return { days: next, undo }
}

/** Deshace un reparto: devuelve cada fila a su día (si no se tocó a mano) y quita los días creados que han quedado vacíos. */
export function undoSplit(days: DraftDay[], undo: SplitUndo): DraftDay[] {
  const exists = new Set(days.map(d => d.key))
  const back = new Map<string, string>()
  for (const d of days) {
    for (const row of d.rows) {
      const origin = undo.origins[row.key]
      if (origin && !row.manual && origin !== d.key && exists.has(origin)) back.set(row.key, origin)
    }
  }
  const moving = days.flatMap(d => d.rows.filter(r => back.has(r.key)))
  const restored = days.map(d => {
    const rows = [
      ...d.rows.filter(r => !back.has(r.key)),
      ...moving.filter(r => back.get(r.key) === d.key),
    ]
    const order = undo.order[d.key]
    if (order) {
      const pos = (key: string) => { const i = order.indexOf(key); return i < 0 ? order.length : i }
      rows.sort((a, b) => pos(a.key) - pos(b.key))
    }
    return { ...d, rows }
  })
  return restored.filter(d => !(d.rows.length === 0 && (d.unassigned || undo.createdDayKeys.includes(d.key))))
}

// ── Nombres ya existentes

export type DuplicateChoice = 'skip' | 'copy'

/** Días que se van a guardar y cuyo nombre coincide exactamente con el de una rutina existente. */
export function findDuplicateDays(days: DraftDay[], existingNames: string[]): DraftDay[] {
  const existing = new Set(existingNames.map(n => n.trim()))
  return days.filter(d => existing.has(d.name.trim()))
}

/** Nombre libre con sufijo: "X (copia)", "X (copia 2)"… */
export function copyName(name: string, taken: Set<string>): string {
  const base = name.trim()
  let candidate = `${base} (copia)`
  for (let n = 2; taken.has(candidate); n++) candidate = `${base} (copia ${n})`
  return candidate
}

/** Aplica la elección por día duplicado (por defecto, omitir). Devuelve los días finales a guardar. */
export function resolveDuplicates(
  days: DraftDay[],
  existingNames: string[],
  choices: Record<string, DuplicateChoice>,
): DraftDay[] {
  const taken = new Set([...existingNames.map(n => n.trim()), ...days.map(d => d.name.trim())])
  const duplicates = new Set(findDuplicateDays(days, existingNames).map(d => d.key))
  const result: DraftDay[] = []
  for (const day of days) {
    if (!duplicates.has(day.key)) {
      result.push(day)
      continue
    }
    if ((choices[day.key] ?? 'skip') === 'skip') continue
    const name = copyName(day.name, taken)
    taken.add(name)
    result.push({ ...day, name })
  }
  return result
}
