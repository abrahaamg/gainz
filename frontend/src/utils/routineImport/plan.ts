// Plan semanal ("5 días · Día 1" … "5 días · Día 5"): reparto de lo importado en N días,
// propuesta automática por músculo, días omitidos y aviso por nombres ya existentes.
// Todo puro: la pantalla solo pinta y llama a estas funciones.

import { normalizeName } from './match'
import type { DraftDay, DraftExercise, DraftRow } from './draft'

export type SplitGroup = 'pull' | 'push' | 'legs'

/** Día (1-based) que se propone para cada grupo. */
export const GROUP_DAY: Record<SplitGroup, number> = { pull: 1, push: 2, legs: 3 }

export const MIN_DAYS = 1
export const MAX_DAYS = 7
export const DEFAULT_DAYS = 5
export const UNASSIGNED_KEY = 'unassigned'

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

/** Día (1-based) propuesto para una fila, o null si no hay propuesta o el plan no tiene ese día. */
export function proposeDay(row: Pick<DraftRow, 'exercise' | 'rawName'>, dayCount: number): number | null {
  const group = row.exercise ? classifyExercise(row.exercise) : classifyRawName(row.rawName)
  if (!group) return null
  const day = GROUP_DAY[group]
  return day <= dayCount ? day : null
}

export function clampDayCount(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_DAYS
  return Math.min(MAX_DAYS, Math.max(MIN_DAYS, Math.round(n)))
}

export function defaultPlanName(dayCount: number): string {
  return `${dayCount} días`
}

export function planDayName(planName: string, dayNumber: number): string {
  return `${planName.trim()} · Día ${dayNumber}`
}

const planDayKey = (n: number) => `plan-day-${n}`

function emptyPlan(planName: string, dayCount: number, skipped: Set<string>): DraftDay[] {
  const days: DraftDay[] = Array.from({ length: dayCount }, (_, i) => ({
    key: planDayKey(i + 1),
    name: planDayName(planName, i + 1),
    rows: [],
    skipped: skipped.has(planDayKey(i + 1)) || undefined,
  }))
  days.push({ key: UNASSIGNED_KEY, name: '', rows: [], unassigned: true })
  return days
}

/** Reparte filas en un plan de `dayCount` días. Lo que no se clasifica va a "Sin asignar" (último elemento). */
export function buildPlanDays(rows: DraftRow[], planName: string, dayCount: number, skipped: Set<string> = new Set()): DraftDay[] {
  const count = clampDayCount(dayCount)
  const days = emptyPlan(planName, count, skipped)
  for (const row of rows) {
    const day = proposeDay(row, count)
    days[day ? day - 1 : count].rows.push({ ...row, manual: false })
  }
  return days
}

/** Cambia el nº de días conservando lo asignado a mano; lo demás se vuelve a proponer. */
export function resizePlan(days: DraftDay[], planName: string, dayCount: number): DraftDay[] {
  const count = clampDayCount(dayCount)
  const skipped = new Set(days.filter(d => d.skipped).map(d => d.key))
  const next = emptyPlan(planName, count, skipped)
  for (const day of days) {
    const index = day.unassigned ? -1 : days.indexOf(day)
    for (const row of day.rows) {
      let target = count // "Sin asignar"
      if (row.manual && index >= 0 && index < count) target = index
      else if (!row.manual) {
        const proposed = proposeDay(row, count)
        if (proposed) target = proposed - 1
      }
      next[target].rows.push(row.manual && target === count ? { ...row, manual: false } : row)
    }
  }
  return next
}

/** Renombra los días del plan (el cajón "Sin asignar" no tiene nombre). */
export function renamePlan(days: DraftDay[], planName: string): DraftDay[] {
  return days.map((d, i) => (d.unassigned ? d : { ...d, name: planDayName(planName, i + 1) }))
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

/** Vuelve a calcular el día de las filas indicadas, salvo las movidas a mano. */
export function reclassifyRows(days: DraftDay[], rowKeys: string[]): DraftDay[] {
  const planDays = days.filter(d => !d.unassigned)
  const count = planDays.length
  const targets = new Map<string, string>()
  for (const d of days) {
    for (const row of d.rows) {
      if (!rowKeys.includes(row.key) || row.manual) continue
      const proposed = proposeDay(row, count)
      const targetKey = proposed ? planDays[proposed - 1].key : UNASSIGNED_KEY
      if (targetKey !== d.key) targets.set(row.key, targetKey)
    }
  }
  if (targets.size === 0) return days
  const moving = days.flatMap(d => d.rows.filter(r => targets.has(r.key)))
  return days.map(d => ({
    ...d,
    rows: [
      ...d.rows.filter(r => !targets.has(r.key)),
      ...moving.filter(r => targets.get(r.key) === d.key),
    ],
  }))
}

export function setDaySkipped(days: DraftDay[], dayKey: string, skipped: boolean): DraftDay[] {
  return days.map(d => (d.key === dayKey ? { ...d, skipped: skipped || undefined } : d))
}

export function unassignedCount(days: DraftDay[]): number {
  return days.filter(d => d.unassigned).reduce((n, d) => n + d.rows.length, 0)
}

/** Vuelve al modo "un día por tabla": agrupa por tabla de origen con los nombres originales. */
export function regroupByTable(days: DraftDay[], tableNames: string[]): DraftDay[] {
  const rows = days.flatMap(d => d.rows)
  return tableNames.map((name, i) => ({
    key: `table-${i}`,
    name,
    rows: rows.filter(r => r.source === i).map(r => ({ ...r, manual: false })),
  }))
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
