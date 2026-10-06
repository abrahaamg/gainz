// Lista de días del borrador: añadir, renombrar, reordenar, quitar y nombre final con prefijo.
// Todo puro: la pantalla solo pinta y llama a estas funciones.

import type { DraftDay } from './draft'

export const MAX_DAYS = 14
export const UNASSIGNED_KEY = 'unassigned'
export const PREFIX_SEPARATOR = ' · '

let counter = 0

const editable = (days: DraftDay[]) => days.filter(d => !d.unassigned)

/** "Día N" con el siguiente número libre (parte de nº de días + 1). */
export function nextDayName(days: DraftDay[]): string {
  const taken = new Set(days.map(d => d.name.trim().toLowerCase()))
  let n = editable(days).length + 1
  while (taken.has(`día ${n}`)) n++
  return `Día ${n}`
}

/** Añade un día vacío al final (antes de "Sin asignar"). Sin efecto al llegar a MAX_DAYS. */
export function addDay(days: DraftDay[], name?: string): DraftDay[] {
  if (editable(days).length >= MAX_DAYS) return days
  const day: DraftDay = { key: `day-new-${++counter}`, name: name ?? nextDayName(days), rows: [] }
  const unassigned = days.findIndex(d => d.unassigned)
  if (unassigned < 0) return [...days, day]
  return [...days.slice(0, unassigned), day, ...days.slice(unassigned)]
}

export function renameDay(days: DraftDay[], dayKey: string, name: string): DraftDay[] {
  return days.map(d => (d.key === dayKey ? { ...d, name } : d))
}

/** Sube (-1) o baja (+1) un día entre los días reales; "Sin asignar" no se mueve. */
export function moveDay(days: DraftDay[], dayKey: string, delta: -1 | 1): DraftDay[] {
  const real = editable(days)
  const from = real.findIndex(d => d.key === dayKey)
  const to = from + delta
  if (from < 0 || to < 0 || to >= real.length) return days
  const reordered = [...real]
  const [item] = reordered.splice(from, 1)
  reordered.splice(to, 0, item)
  return [...reordered, ...days.filter(d => d.unassigned)]
}

/** Quita un día. Sus ejercicios se pasan a `moveToKey` (quedan como movidos a mano) o se descartan si es null. */
export function removeDay(days: DraftDay[], dayKey: string, moveToKey: string | null = null): DraftDay[] {
  const day = days.find(d => d.key === dayKey)
  if (!day) return days
  const target = moveToKey && moveToKey !== dayKey ? days.find(d => d.key === moveToKey) : undefined
  return days
    .filter(d => d.key !== dayKey)
    .map(d => (d === target ? { ...d, rows: [...d.rows, ...day.rows.map(r => ({ ...r, manual: !d.unassigned }))] } : d))
}

/** Nombre final de la rutina: "<prefijo> · <día>" o solo el del día si no hay prefijo. */
export function finalDayName(prefix: string, name: string): string {
  const p = prefix.trim()
  const n = name.trim()
  return p ? `${p}${PREFIX_SEPARATOR}${n}` : n
}

/** Aplica el prefijo a los nombres (para guardar y para la vista previa). */
export function withPrefix(days: DraftDay[], prefix: string): DraftDay[] {
  return days.map(d => (d.unassigned ? d : { ...d, name: finalDayName(prefix, d.name) }))
}
