import { describe, it, expect } from 'vitest'
import {
  addSet, buildPlan, copyPreviousSet, formatPlan, planFromExercise, removeSet, swapPlan, targetForSet, updateSet,
} from './setPlan'

describe('setPlan', () => {
  it('buildPlan: listas por serie', () => {
    expect(buildPlan(5, [9, 8, 8, 9, 8], [62, 62, 57, 55, 50])).toEqual([
      { reps: 9, weight_kg: 62 }, { reps: 8, weight_kg: 62 }, { reps: 8, weight_kg: 57 },
      { reps: 9, weight_kg: 55 }, { reps: 8, weight_kg: 50 },
    ])
  })

  it('buildPlan: un valor único se repite en todas las series', () => {
    const plan = buildPlan(3, [10, 9, 8], [10])
    expect(plan.map(s => s.weight_kg)).toEqual([10, 10, 10])
    expect(plan.map(s => s.reps)).toEqual([10, 9, 8])
  })

  it('buildPlan: lista corta se completa con el último valor; larga amplía las series', () => {
    expect(buildPlan(3, [7, 7], [15, 10]).map(s => [s.reps, s.weight_kg])).toEqual([[7, 15], [7, 10], [7, 10]])
    expect(buildPlan(2, [10, 9, 8], []).length).toBe(3)
  })

  it('buildPlan: sin valores deja null', () => {
    expect(buildPlan(2, [], [])).toEqual([{ reps: null, weight_kg: null }, { reps: null, weight_kg: null }])
  })

  it('planFromExercise: usa set_plan o repite reps/peso (rutinas antiguas)', () => {
    expect(planFromExercise({ set_plan: [{ reps: 5, weight_kg: 100 }], sets: 9, reps: 1, weight_suggestion: 1 }))
      .toEqual([{ reps: 5, weight_kg: 100 }])
    expect(planFromExercise({ set_plan: null, sets: 2, reps: 10, weight_suggestion: 40 }))
      .toEqual([{ reps: 10, weight_kg: 40 }, { reps: 10, weight_kg: 40 }])
  })

  it('targetForSet: serie n (1-based) y tope al final del plan', () => {
    const ex = { set_plan: [{ reps: 10, weight_kg: 20 }, { reps: 9, weight_kg: 22 }], sets: 2, reps: 10, weight_suggestion: 20 }
    expect(targetForSet(ex, 2)).toEqual({ reps: 9, weight_kg: 22 })
    expect(targetForSet(ex, 5)).toEqual({ reps: 9, weight_kg: 22 })
    expect(targetForSet({ set_plan: null, sets: 3, reps: 8, weight_suggestion: null }, 3)).toEqual({ reps: 8, weight_kg: null })
  })

  it('swapPlan intercambia reps y peso', () => {
    expect(swapPlan([{ reps: 80, weight_kg: 9 }])).toEqual([{ reps: 9, weight_kg: 80 }])
  })

  it('addSet duplica la última; removeSet no deja el plan vacío; copyPreviousSet copia la anterior', () => {
    const plan = [{ reps: 10, weight_kg: 20 }, { reps: 8, weight_kg: 25 }]
    expect(addSet(plan)[2]).toEqual({ reps: 8, weight_kg: 25 })
    expect(removeSet(plan, 0)).toEqual([{ reps: 8, weight_kg: 25 }])
    expect(removeSet([plan[0]], 0)).toEqual([plan[0]])
    expect(copyPreviousSet(plan, 1)[1]).toEqual({ reps: 10, weight_kg: 20 })
    expect(copyPreviousSet(plan, 0)).toBe(plan)
    expect(updateSet(plan, 0, { reps: 12 })[0]).toEqual({ reps: 12, weight_kg: 20 })
  })

  it('formatPlan', () => {
    expect(formatPlan([{ reps: 10, weight_kg: 20 }, { reps: 9, weight_kg: 20 }])).toBe('S1 10×20 kg · S2 9×20 kg')
    expect(formatPlan([{ reps: 12, weight_kg: null }, { reps: null, weight_kg: 5.5 }, { reps: null, weight_kg: null }]))
      .toBe('S1 12 · S2 5.5 kg · S3 —')
  })
})
