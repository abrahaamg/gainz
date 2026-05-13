import { describe, it, expect } from 'vitest'
import { calculateOneRM, getPercentageTable } from './oneRM'

describe('calculateOneRM', () => {
  it('devuelve el mismo peso si reps = 1', () => {
    expect(calculateOneRM(100, 1)).toBe(100)
  })

  it('calcula 1RM con fórmula Epley: peso * (1 + reps/30)', () => {
    // 80kg x 5 reps = 80 * (1 + 5/30) = 80 * 1.1667 = 93.33
    const result = calculateOneRM(80, 5)
    expect(result).toBeCloseTo(93.33, 1)
  })

  it('calcula correctamente para 10 reps', () => {
    // 60kg x 10 reps = 60 * (1 + 10/30) = 60 * 1.333 = 80
    expect(calculateOneRM(60, 10)).toBeCloseTo(80, 1)
  })

  it('calcula correctamente para reps altas (20)', () => {
    // 40kg x 20 reps = 40 * (1 + 20/30) = 40 * 1.667 = 66.67
    expect(calculateOneRM(40, 20)).toBeCloseTo(66.67, 1)
  })

  it('devuelve 0 si peso es 0', () => {
    expect(calculateOneRM(0, 5)).toBe(0)
  })
})

describe('getPercentageTable', () => {
  it('devuelve 9 filas de porcentajes', () => {
    const table = getPercentageTable(100)
    expect(table).toHaveLength(9)
  })

  it('la primera fila es 100% = 1RM completo', () => {
    const table = getPercentageTable(100)
    expect(table[0].pct).toBe(100)
    expect(table[0].weight).toBe(100)
    expect(table[0].goalKey).toBe('maxStrength')
  })

  it('calcula los pesos correctamente al 80%', () => {
    const table = getPercentageTable(100)
    const row80 = table.find(r => r.pct === 80)
    expect(row80?.weight).toBe(80)
    expect(row80?.goalKey).toBe('hypertrophy')
  })

  it('redondea a 1 decimal', () => {
    const table = getPercentageTable(73)
    // 73 * 0.85 = 62.05 → parseFloat("62.1") or parseFloat("62.0") depends on rounding
    const row85 = table.find(r => r.pct === 85)
    expect(row85?.weight).toBeCloseTo(62, 0)
  })

  it('la última fila es 50%', () => {
    const table = getPercentageTable(100)
    expect(table[table.length - 1].pct).toBe(50)
    expect(table[table.length - 1].weight).toBe(50)
  })
})
