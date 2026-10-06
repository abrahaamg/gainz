import { describe, it, expect } from 'vitest'
import { parseRoutineText } from './parse'
import { buildDraft, canSave, daysToSave, summarize, type DraftDay, type DraftExercise } from './draft'
import {
  assignRowToDay, buildPlanDays, classifyExercise, clampDayCount, copyName, defaultPlanName, findDuplicateDays,
  planDayName, reclassifyRows, regroupByTable, renamePlan, resizePlan, resolveDuplicates, setDaySkipped,
  unassignedCount, UNASSIGNED_KEY,
} from './plan'
import { CATALOG_FIXTURE } from './catalog.fixture'
import ejemplo from './rutina-ejemplo.fixture.txt?raw'

const catalog: DraftExercise[] = CATALOG_FIXTURE.map(([name, category, muscle_group], i) => ({
  id: i + 1, name, category, muscle_group, created_by: null,
}))
const tables = buildDraft(parseRoutineText(ejemplo), catalog)
const rows = tables.flatMap(d => d.rows)
const plan = () => buildPlanDays(rows, '5 días', 5)

/** Nombres originales (rawName) por día, en orden. Las dos PECK DECK se distinguen por su posición. */
const namesOf = (days: DraftDay[], index: number) => days[index].rows.map(r => r.rawName)

describe('nombre del plan y de los días', () => {
  it('por defecto "5 días" y "5 días · Día N"', () => {
    expect(defaultPlanName(5)).toBe('5 días')
    expect(planDayName('5 días', 1)).toBe('5 días · Día 1')
    expect(plan().slice(0, 5).map(d => d.name)).toEqual([
      '5 días · Día 1', '5 días · Día 2', '5 días · Día 3', '5 días · Día 4', '5 días · Día 5',
    ])
  })

  it('el nombre del plan es configurable y renombra todos los días', () => {
    const renamed = renamePlan(plan(), 'Mi PPL')
    expect(renamed.slice(0, 5).map(d => d.name)).toEqual(['Mi PPL · Día 1', 'Mi PPL · Día 2', 'Mi PPL · Día 3', 'Mi PPL · Día 4', 'Mi PPL · Día 5'])
    expect(renamed[5].unassigned).toBe(true)
  })

  it('el nº de días se limita a 1-7', () => {
    expect(clampDayCount(0)).toBe(1)
    expect(clampDayCount(12)).toBe(7)
    expect(clampDayCount(3.4)).toBe(3)
    expect(buildPlanDays(rows, 'x', 9).filter(d => !d.unassigned)).toHaveLength(7)
  })
})

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

describe('reparto automático con el ejemplo real', () => {
  const days = plan()

  it('pierna del segundo bloque → Día 3', () => {
    expect(namesOf(days, 2)).toEqual([
      'ADDUCTOR', 'FEMORAL SENTADO', 'HACK', 'EXTENSIÓN CUÁDRICEPS', 'RUMANO', 'HIP THRUST',
    ])
  })

  it('empuje → Día 2', () => {
    expect(namesOf(days, 1)).toEqual([
      'ELEVACIONES LATERALES', 'PRESS HOMBRO', 'TRASNUCA', 'PECK DECK', 'PRESS INCLINADO', 'PECK DECK',
    ])
  })

  it('tirón → Día 1', () => {
    expect(namesOf(days, 0)).toEqual([
      'REMO ALTO', 'JALÓN', 'REAR', 'PULLOVER', 'PREDICADOR', 'MARTILLO', 'BAYESIAN', 'REMO UNIL', 'ANTEBRAZO', 'GIRONDA ABIERTO',
    ])
  })

  it('días 4 y 5 quedan vacíos y ABS (core) en "Sin asignar"', () => {
    expect(days[3].rows).toHaveLength(0)
    expect(days[4].rows).toHaveLength(0)
    expect(days[5].key).toBe(UNASSIGNED_KEY)
    expect(days[5].rows.map(r => r.rawName)).toEqual(['ABS'])
    expect(unassignedCount(days)).toBe(1)
  })

  it('con menos días, lo que cae fuera del plan queda sin asignar', () => {
    const two = buildPlanDays(rows, '2 días', 2)
    expect(two[2].unassigned).toBe(true)
    expect(two[2].rows.map(r => r.rawName)).toContain('HACK')
  })

  it('sin asignar bloquea guardar hasta asignarlo o quitarlo', () => {
    const resolved = days.map(d => ({ ...d, rows: d.rows.map(r => ({ ...r, exercise: r.exercise ?? catalog[0] })) }))
    expect(canSave(resolved, true)).toBe(false)
    const abs = resolved[5].rows[0]
    expect(canSave(assignRowToDay(resolved, abs.key, 'plan-day-4'), true)).toBe(true)
    expect(canSave(resolved.map(d => (d.unassigned ? { ...d, rows: [] } : d)), true)).toBe(true)
  })

  it('el reparto es solo una propuesta: asignar a mano marca la fila y sobrevive a reclasificar', () => {
    const moved = assignRowToDay(days, days[0].rows[1].key, 'plan-day-4')
    const row = moved[3].rows[0]
    expect(row.manual).toBe(true)
    expect(reclassifyRows(moved, [row.key])[3].rows[0].key).toBe(row.key)
  })

  it('reclasificar una fila no manual la lleva al día de su nuevo ejercicio', () => {
    const jalon = days[0].rows.find(r => r.rawName === 'JALÓN')!
    const legExercise = catalog.find(c => c.name === 'Hack Squat')!
    const edited = days.map(d => ({ ...d, rows: d.rows.map(r => (r.key === jalon.key ? { ...r, exercise: legExercise } : r)) }))
    const result = reclassifyRows(edited, [jalon.key])
    expect(result[2].rows.some(r => r.key === jalon.key)).toBe(true)
    expect(result[0].rows.some(r => r.key === jalon.key)).toBe(false)
  })

  it('al cambiar el nº de días se conserva lo asignado a mano y el resto se vuelve a proponer', () => {
    const moved = assignRowToDay(days, days[0].rows[0].key, 'plan-day-5')
    const manualKey = moved[4].rows[0].key
    const six = resizePlan(moved, '6 días', 6)
    expect(six.filter(d => !d.unassigned)).toHaveLength(6)
    expect(six[4].rows.map(r => r.key)).toEqual([manualKey])
    const two = resizePlan(six, '2 días', 2)
    expect(two[2].unassigned).toBe(true)
    expect(two[2].rows.map(r => r.rawName)).toEqual(expect.arrayContaining(['ABS', 'HACK']))
    expect(two[2].rows.find(r => r.key === manualKey)?.manual).toBe(false)
  })
})

describe('días omitidos y días vacíos', () => {
  const resolvedPlan = () =>
    plan().map(d => ({ ...d, rows: d.rows.filter(r => r.rawName !== 'ABS').map(r => ({ ...r, exercise: r.exercise ?? catalog[0] })) }))

  it('no se crean rutinas para días vacíos', () => {
    expect(daysToSave(resolvedPlan(), true).map(d => d.name)).toEqual(['5 días · Día 1', '5 días · Día 2', '5 días · Día 3'])
  })

  it('"No importar este día" lo quita del guardado y deja de contar sus filas', () => {
    const skipped = setDaySkipped(resolvedPlan(), 'plan-day-1', true)
    expect(daysToSave(skipped, true).map(d => d.name)).toEqual(['5 días · Día 2', '5 días · Día 3'])
    expect(canSave(skipped, true)).toBe(true)
    expect(summarize(skipped).total).toBe(rows.length - 1 - 10)
    expect(daysToSave(setDaySkipped(skipped, 'plan-day-1', false), true)).toHaveLength(3)
  })

  it('si no queda ningún día con ejercicios no se puede guardar', () => {
    const all = ['plan-day-1', 'plan-day-2', 'plan-day-3'].reduce((acc, k) => setDaySkipped(acc, k, true), resolvedPlan())
    expect(canSave(all, true)).toBe(false)
  })

  it('un día omitido con filas sin resolver no bloquea', () => {
    const base = plan().map(d => (d.unassigned ? { ...d, rows: [] } : d))
    expect(canSave(base, true)).toBe(false)
    const skippedPending = ['plan-day-1', 'plan-day-2', 'plan-day-3'].reduce((acc, k) => setDaySkipped(acc, k, true), base)
    expect(canSave(skippedPending, true)).toBe(false)
  })
})

describe('modo "un día por tabla"', () => {
  it('volver a tablas agrupa por origen con los nombres originales', () => {
    const back = regroupByTable(plan(), tables.map(d => d.name))
    expect(back.map(d => d.rows.length)).toEqual([15, 8])
    expect(back.map(d => d.name)).toEqual(tables.map(d => d.name))
  })

  it('sin plan, canSave sigue exigiendo que cada día tenga filas', () => {
    const resolved = tables.map(d => ({ ...d, rows: d.rows.map(r => ({ ...r, exercise: r.exercise ?? catalog[0] })) }))
    expect(canSave(resolved)).toBe(true)
    expect(canSave([...resolved, { key: 'x', name: 'Vacío', rows: [] }])).toBe(false)
  })
})

describe('aviso por nombre duplicado', () => {
  const days = daysToSave(plan(), true)

  it('detecta solo los nombres exactamente iguales a rutinas existentes', () => {
    expect(findDuplicateDays(days, ['5 días · Día 1', '5 días · Día 11', 'otra']).map(d => d.name)).toEqual(['5 días · Día 1'])
    expect(findDuplicateDays(days, ['5 días · día 1'])).toHaveLength(0)
    expect(findDuplicateDays(days, [])).toHaveLength(0)
  })

  it('omitir quita ese día; copiar le añade el sufijo y deja los demás igual', () => {
    const existing = ['5 días · Día 1', '5 días · Día 2']
    const result = resolveDuplicates(days, existing, { [days[0].key]: 'skip', [days[1].key]: 'copy' })
    expect(result.map(d => d.name)).toEqual(['5 días · Día 2 (copia)', '5 días · Día 3'])
  })

  it('sin elección se omite por defecto', () => {
    expect(resolveDuplicates(days, ['5 días · Día 1'], {}).map(d => d.name)).toEqual(['5 días · Día 2', '5 días · Día 3'])
  })

  it('el sufijo evita chocar con otra copia existente', () => {
    expect(copyName('X', new Set(['X', 'X (copia)']))).toBe('X (copia 2)')
    const result = resolveDuplicates(days, ['5 días · Día 1', '5 días · Día 1 (copia)'], { [days[0].key]: 'copy' })
    expect(result[0].name).toBe('5 días · Día 1 (copia 2)')
  })
})
