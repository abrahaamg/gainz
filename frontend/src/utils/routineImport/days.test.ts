import { describe, it, expect } from 'vitest'
import { parseRoutineText } from './parse'
import { buildDraft, canSave, daysToSave, dayToPayload, type DraftDay, type DraftExercise } from './draft'
import { assignRowToDay, setDaySkipped } from './plan'
import { addDay, finalDayName, MAX_DAYS, moveDay, nextDayName, removeDay, renameDay, withPrefix } from './days'
import { CATALOG_FIXTURE } from './catalog.fixture'
import ejemplo from './rutina-ejemplo.fixture.txt?raw'

const catalog: DraftExercise[] = CATALOG_FIXTURE.map(([name, category, muscle_group], i) => ({
  id: i + 1, name, category, muscle_group, created_by: null,
}))
const resolve = (days: DraftDay[]) =>
  days.map(d => ({ ...d, rows: d.rows.map(r => ({ ...r, exercise: r.exercise ?? catalog[0] })) }))
const tables = () => buildDraft(parseRoutineText(ejemplo), catalog)

describe('días por defecto', () => {
  it('uno por tabla pegada, con su nombre y cada ejercicio en el día de su tabla', () => {
    const days = tables()
    expect(days.map(d => d.name)).toEqual(['Día 1', 'Día 2'])
    expect(days.map(d => d.rows.length)).toEqual([15, 8])
    expect(days.every(d => d.rows.every(r => !r.manual))).toBe(true)
  })
})

describe('añadir, renombrar y reordenar', () => {
  it('añadir usa el siguiente "Día N" libre', () => {
    const three = addDay(tables())
    expect(three.map(d => d.name)).toEqual(['Día 1', 'Día 2', 'Día 3'])
    expect(three[2].rows).toEqual([])
    expect(addDay(three).map(d => d.name)[3]).toBe('Día 4')
  })

  it('si el nombre ya existe salta al siguiente libre', () => {
    const base = tables()
    const days = renameDay(base, base[0].key, 'Día 3')
    expect(nextDayName(days)).toBe('Día 4')
  })

  it('con "Sin asignar" el día nuevo va antes', () => {
    const days: DraftDay[] = [...tables(), { key: 'unassigned', name: '', rows: [], unassigned: true }]
    const next = addDay(days)
    expect(next.at(-1)?.unassigned).toBe(true)
    expect(next[2].name).toBe('Día 3')
  })

  it('máximo 14 días', () => {
    let days = tables()
    for (let i = 0; i < 20; i++) days = addDay(days)
    expect(days).toHaveLength(MAX_DAYS)
  })

  it('renombrar solo cambia ese día', () => {
    const base = tables()
    const days = renameDay(base, base[1].key, 'Pierna')
    expect(days.map(d => d.name)).toEqual(['Día 1', 'Pierna'])
  })

  it('subir/bajar reordena y respeta los extremos', () => {
    const base = addDay(tables())
    const down = moveDay(base, base[0].key, 1)
    expect(down.map(d => d.name)).toEqual(['Día 2', 'Día 1', 'Día 3'])
    expect(moveDay(base, base[0].key, -1)).toBe(base)
    expect(moveDay(base, base[2].key, 1)).toBe(base)
  })
})

describe('quitar un día', () => {
  it('moviendo sus ejercicios a otro día (quedan como manuales, al final)', () => {
    const base = tables()
    const days = removeDay(base, base[1].key, base[0].key)
    expect(days).toHaveLength(1)
    expect(days[0].rows).toHaveLength(23)
    expect(days[0].rows.slice(15).every(r => r.manual)).toBe(true)
  })

  it('descartando sus ejercicios', () => {
    const base = tables()
    const days = removeDay(base, base[1].key, null)
    expect(days.map(d => d.rows.length)).toEqual([15])
  })

  it('mover a sí mismo o a un día que no existe equivale a descartar', () => {
    const base = tables()
    expect(removeDay(base, base[1].key, base[1].key).map(d => d.rows.length)).toEqual([15])
    expect(removeDay(base, base[1].key, 'nope').map(d => d.rows.length)).toEqual([15])
  })
})

describe('guardado', () => {
  it('los días vacíos se guardan como rutinas vacías', () => {
    const days = resolve(addDay(tables()))
    expect(canSave(days)).toBe(true)
    const list = daysToSave(days)
    expect(list.map(d => d.name)).toEqual(['Día 1', 'Día 2', 'Día 3'])
    expect(dayToPayload(list[2]).exercises).toEqual([])
  })

  it('un día omitido no se guarda aunque esté vacío', () => {
    const days = resolve(addDay(tables()))
    expect(daysToSave(setDaySkipped(days, days[2].key, true)).map(d => d.name)).toEqual(['Día 1', 'Día 2'])
  })

  it('un día sin nombre bloquea el guardado', () => {
    const days = resolve(tables())
    expect(canSave(renameDay(days, days[0].key, '  '))).toBe(false)
  })

  it('ejemplo real: 2 días, se añade un tercero y se mueven las 6 de pierna → 3 rutinas', () => {
    let days = resolve(tables())
    expect(days).toHaveLength(2)
    days = addDay(days)
    const legs = days[1].rows.slice(0, 6)
    expect(legs.map(r => r.rawName)).toEqual(['ADDUCTOR', 'FEMORAL SENTADO', 'HACK', 'EXTENSIÓN CUÁDRICEPS', 'RUMANO', 'HIP THRUST'])
    for (const r of legs) days = assignRowToDay(days, r.key, days[2].key)
    expect(days.map(d => d.rows.length)).toEqual([15, 2, 6])
    const list = withPrefix(daysToSave(days), '3 días')
    expect(canSave(days)).toBe(true)
    expect(list.map(d => d.name)).toEqual(['3 días · Día 1', '3 días · Día 2', '3 días · Día 3'])
    expect(list.map(d => dayToPayload(d).exercises.length)).toEqual([15, 2, 6])
  })
})

describe('prefijo', () => {
  it('vacío: nombre del día tal cual', () => {
    expect(finalDayName('', ' Pierna ')).toBe('Pierna')
    expect(finalDayName('   ', 'Pierna')).toBe('Pierna')
  })

  it('relleno: "<prefijo> · <día>"', () => {
    expect(finalDayName(' 5 días ', 'Pierna')).toBe('5 días · Pierna')
  })

  it('withPrefix no toca "Sin asignar" ni las filas', () => {
    const days: DraftDay[] = [...tables(), { key: 'unassigned', name: '', rows: [], unassigned: true }]
    const out = withPrefix(days, 'X')
    expect(out.map(d => d.name)).toEqual(['X · Día 1', 'X · Día 2', ''])
    expect(out[0].rows).toBe(days[0].rows)
  })
})
