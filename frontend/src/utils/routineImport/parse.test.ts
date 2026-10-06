import { describe, it, expect } from 'vitest'
import { parseRoutineText } from './parse'
import ejemplo from './rutina-ejemplo.fixture.txt?raw'

describe('parseRoutineText · ejemplo real (celda por línea de Google Docs)', () => {
  const { days } = parseRoutineText(ejemplo)

  it('detecta 2 días con 15 y 8 filas', () => {
    expect(days).toHaveLength(2)
    expect(days.map(d => d.name)).toEqual(['Día 1', 'Día 2'])
    expect(days[0].rows).toHaveLength(15)
    expect(days[1].rows).toHaveLength(8)
  })

  it('REMO ALTO: 5 series con reps y pesos por serie', () => {
    const row = days[0].rows.find(r => r.rawName === 'REMO ALTO')!
    expect(row.sets).toBe(5)
    expect(row.reps).toEqual([9, 8, 8, 9, 8])
    expect(row.weights).toEqual([62, 62, 57, 55, 50])
    expect(row.warnings).toEqual([])
  })

  it('un valor único queda como lista de un elemento', () => {
    const row = days[0].rows.find(r => r.rawName === 'PULLOVER')!
    expect(row.reps).toEqual([10, 9, 8])
    expect(row.weights).toEqual([10])
  })

  it('20(subir) → peso 20 y nota subir', () => {
    const row = days[0].rows[0]
    expect(row.rawName).toBe('ELEVACIONES LATERALES')
    expect(row.weights).toEqual([20])
    expect(row.notes).toBe('subir')
  })

  it('HACK(verde) → nombre HACK, nota (verde) y la nota suelta roja se añade', () => {
    const row = days[1].rows.find(r => r.rawName === 'HACK')!
    expect(row.notes).toContain('(verde)')
    expect(row.notes).toContain('roja')
    expect(row.weights).toEqual([160])
    expect(days[1].rows.find(r => r.rawName === 'EXTENSIÓN CUÁDRICEPS')!.notes).toBe('')
  })

  it('REMO UNIL lleva aviso de reps/peso intercambiados; el resto de filas no', () => {
    const row = days[0].rows.find(r => r.rawName === 'REMO UNIL')!
    expect(row.warnings).toContain('swapped')
    const swapped = days.flatMap(d => d.rows).filter(r => r.warnings.includes('swapped'))
    expect(swapped).toHaveLength(1)
  })

  it('PECK DECK del día 2 avisa de nº de valores distinto a las series', () => {
    const row = days[1].rows.find(r => r.rawName === 'PECK DECK')!
    expect(row.sets).toBe(3)
    expect(row.warnings).toEqual(expect.arrayContaining(['repsCount', 'weightsCount']))
  })
})

describe('parseRoutineText · otros formatos', () => {
  it('título "DIA 1" encima de la cabecera en celda por línea', () => {
    const text = 'DIA 1\nEJERCICIO\nSERIES\nREPS\nPESO\nANOTACIONES\nPRESS\n3\n10\n40\n\n\nDIA 2\nEJERCICIO\nSERIES\nREPS\nPESO\nANOTACIONES\nREMO\n4\n8\n30\n'
    const { days } = parseRoutineText(text)
    expect(days.map(d => d.name)).toEqual(['Día 1', 'Día 2'])
    expect(days[0].rows[0]).toMatchObject({ rawName: 'PRESS', sets: 3, reps: [10], weights: [40] })
  })

  it('tabuladores (Sheets / Excel / Word)', () => {
    const text = 'EJERCICIO\tSERIES\tREPS\tPESO\tANOTACIONES\nPress banca\t4\t10-9-8-7\t60-60-62.5-62.5\tlento\nRemo\t3\t12\t40\t\n\nEJERCICIO\tSERIES\tREPS\tPESO\tANOTACIONES\nSentadilla\t3\t8\t80\t'
    const { days } = parseRoutineText(text)
    expect(days).toHaveLength(2)
    expect(days[0].rows[0]).toMatchObject({ rawName: 'Press banca', sets: 4, reps: [10, 9, 8, 7], weights: [60, 60, 62.5, 62.5], notes: 'lento' })
    expect(days[0].rows[1].weights).toEqual([40])
    expect(days[1].rows[0].rawName).toBe('Sentadilla')
  })

  it('tabuladores con columnas en otro orden', () => {
    const { days } = parseRoutineText('Ejercicio\tPeso\tReps\tSeries\nCurl\t20\t10\t3')
    expect(days[0].rows[0]).toMatchObject({ sets: 3, reps: [10], weights: [20] })
  })

  it('CSV simple con ; y con ,', () => {
    const a = parseRoutineText('Ejercicio;Series;Reps;Peso\nPress;3;10;50\nRemo;3;12-10-8;40')
    expect(a.days[0].rows).toHaveLength(2)
    expect(a.days[0].rows[1].reps).toEqual([12, 10, 8])
    const b = parseRoutineText('Ejercicio,Series,Reps,Peso\nPress,3,10,50')
    expect(b.days[0].rows[0]).toMatchObject({ rawName: 'Press', sets: 3, reps: [10], weights: [50] })
  })

  it('texto libre con separadores de día', () => {
    const text = 'Día 1\nPress banca 4x8 60kg\nCurl con barra 3x12 @ 25\n\nLunes\nSentadilla 5x5 100 kg\n\nPUSH\nFondos 3x10'
    const { days } = parseRoutineText(text)
    expect(days.map(d => d.name)).toEqual(['Día 1', 'Lunes', 'Push'])
    expect(days[0].rows[0]).toMatchObject({ rawName: 'Press banca', sets: 4, reps: [8], weights: [60] })
    expect(days[0].rows[1]).toMatchObject({ rawName: 'Curl con barra', sets: 3, reps: [12], weights: [25] })
    expect(days[1].rows[0]).toMatchObject({ rawName: 'Sentadilla', sets: 5, reps: [5], weights: [100] })
    expect(days[2].rows[0].weights).toEqual([])
  })

  it('texto libre con reps por serie y nota entre paréntesis', () => {
    const { days } = parseRoutineText('Press inclinado (mancuernas) 3x10-8-6 30-32-34kg')
    expect(days[0].rows[0]).toMatchObject({ rawName: 'Press inclinado', reps: [10, 8, 6], weights: [30, 32, 34], notes: '(mancuernas)' })
  })

  it('entrada vacía → sin días', () => {
    expect(parseRoutineText('  \n\n').days).toEqual([])
  })
})
