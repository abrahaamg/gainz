import { describe, it, expect } from 'vitest'
import { formatSetRef, lastSetFor, resolveTyped, setHints, stepFrom } from './liveSet'

const last = [
  { set_number: 1, reps_done: 10, weight_kg: 20, rpe: 7 },
  { set_number: 2, reps_done: 9, weight_kg: 22.5, rpe: 8 },
]

describe('liveSet', () => {
  it('lastSetFor: misma serie, o la última si no existió; null sin historial', () => {
    expect(lastSetFor(last, 2)?.reps_done).toBe(9)
    expect(lastSetFor(last, 5)?.set_number).toBe(2)
    expect(lastSetFor([], 1)).toBeNull()
    expect(lastSetFor(undefined, 1)).toBeNull()
  })

  it('setHints: la última vez manda; sin historial, el objetivo del plan', () => {
    expect(setHints(last[0], { reps: 12, weight_kg: 30 })).toEqual({ repsPlaceholder: 10, weightPlaceholder: 20 })
    expect(setHints(null, { reps: 12, weight_kg: 30 })).toEqual({ repsPlaceholder: 12, weightPlaceholder: 30 })
    expect(setHints({ ...last[0], weight_kg: null }, { reps: 12, weight_kg: 30 }).weightPlaceholder).toBe(30)
    expect(setHints(null, null)).toEqual({ repsPlaceholder: null, weightPlaceholder: null })
  })

  it('resolveTyped: lo tecleado gana; vacío usa el placeholder; sin nada, null', () => {
    expect(resolveTyped('12', 10)).toBe(12)
    expect(resolveTyped('', 10)).toBe(10)
    expect(resolveTyped('0', 10)).toBe(0)
    expect(resolveTyped('22,5', null)).toBe(22.5)
    expect(resolveTyped('', null)).toBeNull()
  })

  it('stepFrom: parte del valor tecleado o del placeholder', () => {
    expect(stepFrom('', 20, 2.5)).toBe(22.5)
    expect(stepFrom('30', 20, -2.5)).toBe(27.5)
    expect(stepFrom('', null, 1)).toBe(1)
    expect(stepFrom('', 1, -5)).toBe(0)
  })

  it('formatSetRef', () => {
    expect(formatSetRef(10, 20)).toBe('20 kg × 10')
    expect(formatSetRef(10, null)).toBe('10')
    expect(formatSetRef(null, 20)).toBe('20 kg')
    expect(formatSetRef(null, null)).toBeNull()
  })
})
