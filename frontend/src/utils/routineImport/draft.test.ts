import { describe, it, expect } from 'vitest'
import { parseRoutineText } from './parse'
import { buildDraft, canSave, dayToPayload, dismissWarning, moveRow, moveRowToDay, summarize, swapRow } from './draft'
import { CATALOG_FIXTURE } from './catalog.fixture'
import ejemplo from './rutina-ejemplo.fixture.txt?raw'

const catalog = CATALOG_FIXTURE.map(([name, category, muscle_group], i) => ({ id: i + 1, name, category, muscle_group }))
const days = buildDraft(parseRoutineText(ejemplo), catalog)
const row = (day: number, name: string) => days[day].rows.find(r => r.rawName === name)!

describe('buildDraft con el ejemplo real', () => {
  it('17 emparejadas solas y 6 por revisar', () => {
    expect(summarize(days)).toEqual({ matched: 17, pending: 6, total: 23 })
    expect(canSave(days)).toBe(false)
  })

  it('las filas sin resolver traen sugerencias', () => {
    expect(row(0, 'PULLOVER').exercise).toBeNull()
    expect(row(0, 'PULLOVER').suggestions.map(s => s.name)).toContain('Pullover en Polea')
  })

  it('REMO ALTO queda con 5 series por serie', () => {
    expect(row(0, 'REMO ALTO').plan).toEqual([
      { reps: 9, weight_kg: 62 }, { reps: 8, weight_kg: 62 }, { reps: 8, weight_kg: 57 },
      { reps: 9, weight_kg: 55 }, { reps: 8, weight_kg: 50 },
    ])
  })
})

describe('acciones sobre el borrador', () => {
  it('swapRow intercambia reps/peso y quita el aviso', () => {
    const swapped = swapRow(row(0, 'REMO UNIL'))
    expect(swapped.plan.map(s => s.reps)).toEqual([9, 8, 8])
    expect(swapped.plan.map(s => s.weight_kg)).toEqual([80, 75, 75])
    expect(swapped.warnings).not.toContain('swapped')
  })

  it('dismissWarning quita solo ese aviso', () => {
    const r = row(1, 'PECK DECK')
    expect(dismissWarning(r, 'repsCount').warnings).toEqual(['weightsCount'])
  })

  it('moveRow reordena y respeta los límites', () => {
    const moved = moveRow(days[0], 0, 1)
    expect(moved.rows[1].rawName).toBe('ELEVACIONES LATERALES')
    expect(moveRow(days[0], 0, -1)).toBe(days[0])
  })

  it('moveRowToDay pasa la fila al final de otro día', () => {
    const result = moveRowToDay(days, 0, 0, 1)
    expect(result[0].rows).toHaveLength(14)
    expect(result[1].rows).toHaveLength(9)
    expect(result[1].rows[8].rawName).toBe('ELEVACIONES LATERALES')
  })

  it('canSave exige todo resuelto y día con nombre', () => {
    const resolved = days.map(d => ({
      ...d,
      rows: d.rows.map(r => ({ ...r, exercise: r.exercise ?? catalog[0] })),
    }))
    expect(canSave(resolved)).toBe(true)
    expect(canSave([{ ...resolved[0], name: '  ' }])).toBe(false)
    expect(canSave([{ ...resolved[0], rows: [] }])).toBe(false)
  })
})

describe('dayToPayload', () => {
  const resolved = { ...days[0], rows: days[0].rows.map(r => ({ ...r, exercise: r.exercise ?? catalog[0] })) }
  const payload = dayToPayload(resolved)

  it('crea la rutina con descripción "Importada" y un ejercicio por fila, en orden', () => {
    expect(payload.name).toBe('Día 1')
    expect(payload.description).toBe('Importada')
    expect(payload.exercises).toHaveLength(15)
    expect(payload.exercises.map(e => e.order_index)).toEqual([...Array(15).keys()])
  })

  it('REMO ALTO: set_plan completo, sets = nº de series y notas vacías', () => {
    const ex = payload.exercises[1]
    expect(ex.set_plan).toHaveLength(5)
    expect(ex.set_plan?.map(s => s.reps)).toEqual([9, 8, 8, 9, 8])
    expect(ex.set_plan?.map(s => s.weight_kg)).toEqual([62, 62, 57, 55, 50])
    expect(ex.sets).toBe(5)
    expect(ex.reps).toBe(9)
    expect(ex.weight_suggestion).toBe(62)
    expect(ex.notes).toBeNull()
  })

  it('en notes solo van las anotaciones reales', () => {
    expect(payload.exercises[0].notes).toBe('subir')
    expect(payload.exercises[0].set_plan?.every(s => s.weight_kg === 20)).toBe(true)
  })
})
