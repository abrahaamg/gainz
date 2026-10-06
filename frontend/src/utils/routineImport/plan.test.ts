import { describe, it, expect } from 'vitest'
import { parseRoutineText } from './parse'
import { buildDraft, canSave, daysToSave, summarize, type DraftDay, type DraftExercise } from './draft'
import {
  assignRowToDay, classifyExercise, copyName, DEFAULT_SPLIT, findDuplicateDays, resolveDuplicates, setDaySkipped,
  splitByMuscle, undoSplit, unassignedCount,
} from './plan'
import { addDay, removeDay, UNASSIGNED_KEY, withPrefix } from './days'
import { CATALOG_FIXTURE } from './catalog.fixture'
import ejemplo from './rutina-ejemplo.fixture.txt?raw'

const catalog: DraftExercise[] = CATALOG_FIXTURE.map(([name, category, muscle_group], i) => ({
  id: i + 1, name, category, muscle_group, created_by: null,
}))
const tables = () => buildDraft(parseRoutineText(ejemplo), catalog)
const resolve = (days: DraftDay[]): DraftDay[] =>
  days.map(d => ({ ...d, rows: d.rows.map(r => ({ ...r, exercise: r.exercise ?? catalog[0] })) }))

/** Nombres originales (rawName) por día, en orden. Las dos PECK DECK se distinguen por su posición. */
const namesOf = (days: DraftDay[], index: number) => days[index].rows.map(r => r.rawName)

describe('clasificación por músculo', () => {
  const find = (name: string) => catalog.find(c => c.name === name)!
  it.each([
    ['Hack Squat', 'legs'], ['Peso Muerto Rumano', 'legs'], ['Femoral en Máquina Sentado', 'legs'],
    ['Peck Deck', 'push'], ['Press con Mancuernas (Hombro)', 'push'], ['Elevaciones Laterales en Polea', 'push'],
    ['Extensión de Tríceps Trasnuca en Polea', 'push'],
    ['Jalón al Pecho Agarre Abierto', 'pull'], ['Curl Bayesian', 'pull'], ['Reverse Flys (Pájaro)', 'pull'],
    ['Face Pull', 'pull'], ['Pullover con Mancuerna', 'pull'], ['Remo Gironda Agarre Abierto', 'pull'],
  ])('%s → %s', (name, group) => {
    expect(classifyExercise(find(name))).toBe(group)
  })

  it('core y cuerpo completo no se clasifican', () => {
    expect(classifyExercise(find('Crunch en Máquina'))).toBeNull()
    expect(classifyExercise(find('Burpees'))).toBeNull()
  })
})

describe('reparto por músculo con el ejemplo real (3 días por defecto)', () => {
  const { days, undo } = splitByMuscle(tables(), DEFAULT_SPLIT)

  it('crea el Día 3 que faltaba y reparte tirón → 1, empuje → 2, pierna → 3', () => {
    expect(days.filter(d => !d.unassigned).map(d => d.name)).toEqual(['Día 1', 'Día 2', 'Día 3'])
    expect(namesOf(days, 0)).toEqual([
      'REMO ALTO', 'JALÓN', 'REAR', 'PULLOVER', 'PREDICADOR', 'MARTILLO', 'BAYESIAN', 'REMO UNIL', 'ANTEBRAZO', 'GIRONDA ABIERTO',
    ])
    expect(namesOf(days, 1)).toEqual([
      'PRESS INCLINADO', 'PECK DECK', 'ELEVACIONES LATERALES', 'PRESS HOMBRO', 'TRASNUCA', 'PECK DECK',
    ])
    expect(namesOf(days, 2)).toEqual([
      'ADDUCTOR', 'FEMORAL SENTADO', 'HACK', 'EXTENSIÓN CUÁDRICEPS', 'RUMANO', 'HIP THRUST',
    ])
    expect(undo.createdDayKeys).toHaveLength(1)
  })

  it('lo que no se clasifica (ABS) va a "Sin asignar" y bloquea guardar hasta asignarlo', () => {
    expect(days[3].key).toBe(UNASSIGNED_KEY)
    expect(namesOf(days, 3)).toEqual(['ABS'])
    expect(unassignedCount(days)).toBe(1)
    const resolved = resolve(days)
    expect(canSave(resolved)).toBe(false)
    expect(canSave(assignRowToDay(resolved, resolved[3].rows[0].key, resolved[2].key))).toBe(true)
  })

  it('las filas repartidas no quedan marcadas como manuales', () => {
    expect(days.flatMap(d => d.rows).some(r => r.manual)).toBe(false)
  })
})

describe('reparto con días y mapeo personalizados', () => {
  it('2 días: pierna y empuje → 2, tirón → 1', () => {
    const { days } = splitByMuscle(tables(), { dayCount: 2, groupDays: { pull: 1, push: 2, legs: 2 } })
    expect(days.filter(d => !d.unassigned)).toHaveLength(2)
    expect(days[1].rows.map(r => r.rawName)).toEqual(expect.arrayContaining(['HACK', 'PRESS HOMBRO']))
    expect(days[0].rows).toHaveLength(10)
  })

  it('5 días: crea Día 3, 4 y 5; con grupos en 5, 1 y 4', () => {
    const { days, undo } = splitByMuscle(tables(), { dayCount: 5, groupDays: { pull: 5, push: 1, legs: 4 } })
    expect(days.filter(d => !d.unassigned).map(d => d.name)).toEqual(['Día 1', 'Día 2', 'Día 3', 'Día 4', 'Día 5'])
    expect(undo.createdDayKeys).toHaveLength(3)
    expect(days[3].rows).toHaveLength(6)
    expect(days[4].rows).toHaveLength(10)
    expect(days[1].rows).toHaveLength(0)
  })

  it('un grupo en un día mayor que dayCount se limita al último', () => {
    const { days } = splitByMuscle(tables(), { dayCount: 2, groupDays: { pull: 9, push: 1, legs: 1 } })
    expect(days[1].rows).toHaveLength(10)
  })

  it('no toca lo movido a mano', () => {
    let days = addDay(tables())
    const hack = days[1].rows.find(r => r.rawName === 'HACK')!
    days = assignRowToDay(days, hack.key, days[0].key)
    const result = splitByMuscle(days, DEFAULT_SPLIT).days
    expect(result[0].rows.some(r => r.key === hack.key)).toBe(true)
    expect(result[2].rows.some(r => r.key === hack.key)).toBe(false)
  })

  it('un segundo reparto con otro mapeo recoloca lo repartido antes', () => {
    const first = splitByMuscle(tables(), DEFAULT_SPLIT).days
    const second = splitByMuscle(first, { dayCount: 3, groupDays: { pull: 3, push: 2, legs: 1 } }).days
    expect(second[0].rows).toHaveLength(6)
    expect(second[2].rows).toHaveLength(10)
  })
})

describe('deshacer reparto', () => {
  it('devuelve cada fila a su día y orden, y quita el día creado y "Sin asignar" vacíos', () => {
    const before = tables()
    const { days, undo } = splitByMuscle(before, DEFAULT_SPLIT)
    const back = undoSplit(days, undo)
    expect(back.map(d => d.key)).toEqual(before.map(d => d.key))
    expect(back.map(d => d.rows.map(r => r.key))).toEqual(before.map(d => d.rows.map(r => r.key)))
  })

  it('respeta lo movido a mano después del reparto', () => {
    const { days, undo } = splitByMuscle(tables(), DEFAULT_SPLIT)
    const hack = days[2].rows.find(r => r.rawName === 'HACK')!
    const moved = assignRowToDay(days, hack.key, days[0].key)
    const back = undoSplit(moved, undo)
    expect(back.find(d => d.rows.some(r => r.key === hack.key))?.key).toBe(days[0].key)
  })

  it('conserva el día creado si el usuario le dejó ejercicios a mano', () => {
    const { days, undo } = splitByMuscle(tables(), DEFAULT_SPLIT)
    const created = days[2]
    const keep = created.rows[0]
    const moved = assignRowToDay(assignRowToDay(days, keep.key, days[0].key), keep.key, created.key)
    const back = undoSplit(moved, undo)
    expect(back.find(d => d.key === created.key)?.rows.map(r => r.key)).toEqual([keep.key])
  })

  it('si se quitó el día de origen, no falla', () => {
    const before = tables()
    const { days, undo } = splitByMuscle(before, DEFAULT_SPLIT)
    const removed = removeDay(days, before[0].key, null)
    expect(() => undoSplit(removed, undo)).not.toThrow()
  })
})

describe('días omitidos', () => {
  const base = () => resolve(addDay(tables()))

  it('"No importar este día" lo quita del guardado y deja de contar sus filas', () => {
    const days = base()
    const skipped = setDaySkipped(days, days[0].key, true)
    expect(daysToSave(skipped)).toHaveLength(2)
    expect(summarize(skipped).total).toBe(8)
  })

  it('si se omiten todos no se puede guardar', () => {
    const days = base()
    const all = days.reduce<DraftDay[]>((acc, d) => setDaySkipped(acc, d.key, true), days)
    expect(canSave(all)).toBe(false)
  })

  it('un día omitido con filas sin resolver no bloquea al resto', () => {
    const days = resolve(tables())
    const pending = [days[0], { ...days[1], rows: tables()[1].rows.map(r => ({ ...r, exercise: null })) }]
    expect(canSave(pending)).toBe(false)
    expect(canSave(setDaySkipped(pending, days[1].key, true))).toBe(true)
  })
})

describe('aviso por nombre duplicado', () => {
  const days = () => withPrefix(daysToSave(addDay(tables())), '3 días')

  it('detecta solo los nombres exactamente iguales a rutinas existentes (con prefijo)', () => {
    expect(findDuplicateDays(days(), ['3 días · Día 1', '3 días · Día 11', 'otra']).map(d => d.name)).toEqual(['3 días · Día 1'])
    expect(findDuplicateDays(days(), ['3 días · día 1'])).toHaveLength(0)
    expect(findDuplicateDays(days(), [])).toHaveLength(0)
  })

  it('omitir quita ese día; copiar le añade el sufijo y deja los demás igual', () => {
    const list = days()
    const result = resolveDuplicates(list, ['3 días · Día 1', '3 días · Día 2'], { [list[0].key]: 'skip', [list[1].key]: 'copy' })
    expect(result.map(d => d.name)).toEqual(['3 días · Día 2 (copia)', '3 días · Día 3'])
  })

  it('sin elección se omite por defecto', () => {
    expect(resolveDuplicates(days(), ['3 días · Día 1'], {}).map(d => d.name)).toEqual(['3 días · Día 2', '3 días · Día 3'])
  })

  it('el sufijo evita chocar con otra copia existente', () => {
    expect(copyName('X', new Set(['X', 'X (copia)']))).toBe('X (copia 2)')
    const list = days()
    const result = resolveDuplicates(list, ['3 días · Día 1', '3 días · Día 1 (copia)'], { [list[0].key]: 'copy' })
    expect(result[0].name).toBe('3 días · Día 1 (copia 2)')
  })
})
