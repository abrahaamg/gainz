import { describe, it, expect } from 'vitest'
import { applySetPlan, parseSetPlan } from './setPlan'
import { createRoutineBody, updateRoutineBody } from '../schemas/routine'

const baseExercise = { exercise_id: 1, order_index: 0, sets: 4, reps: 12, weight_suggestion: 30 }

describe('applySetPlan', () => {
  it('deriva sets, reps y weight_suggestion del plan e ignora los sueltos', () => {
    const result = applySetPlan({
      ...baseExercise,
      set_plan: [
        { reps: 10, weight_kg: 20 },
        { reps: 9, weight_kg: 20 },
        { reps: 8, weight_kg: 20 },
      ],
    })
    expect(result.sets).toBe(3)
    expect(result.reps).toBe(10)
    expect(result.weight_suggestion).toBe(20)
    expect(result.set_plan).toHaveLength(3)
  })

  it('admite nulls en la primera serie', () => {
    const result = applySetPlan({ ...baseExercise, set_plan: [{ reps: null, weight_kg: null }] })
    expect(result.sets).toBe(1)
    expect(result.reps).toBeNull()
    expect(result.weight_suggestion).toBeNull()
  })

  it('sin plan deja el ejercicio como llega y set_plan a null', () => {
    expect(applySetPlan(baseExercise)).toEqual({ ...baseExercise, set_plan: null })
    expect(applySetPlan({ ...baseExercise, set_plan: null })).toEqual({ ...baseExercise, set_plan: null })
  })
})

describe('parseSetPlan', () => {
  const plan = [{ reps: 9, weight_kg: 62 }, { reps: 8, weight_kg: 57.5 }]

  it('acepta el JSON ya parseado por el driver', () => {
    expect(parseSetPlan(plan)).toEqual(plan)
  })

  it('acepta el JSON como texto', () => {
    expect(parseSetPlan(JSON.stringify(plan))).toEqual(plan)
  })

  it('devuelve null si no hay plan', () => {
    expect(parseSetPlan(null)).toBeNull()
    expect(parseSetPlan(undefined)).toBeNull()
    expect(parseSetPlan('null')).toBeNull()
    expect(parseSetPlan([])).toBeNull()
  })

  it('normaliza números en texto y campos que faltan a null', () => {
    expect(parseSetPlan([{ reps: '10', weight_kg: '20.5' }, { reps: 8 }])).toEqual([
      { reps: 10, weight_kg: 20.5 },
      { reps: 8, weight_kg: null },
    ])
  })
})

describe('esquema de set_plan', () => {
  const body = (set_plan: unknown) => ({
    name: 'Rutina',
    exercises: [{ exercise_id: 1, order_index: 0, set_plan }],
  })

  it('acepta un plan válido, con nulls y números en texto', () => {
    const result = createRoutineBody.safeParse(body([
      { reps: 10, weight_kg: 20 },
      { reps: '9', weight_kg: '20.5' },
      { reps: null, weight_kg: null },
    ]))
    expect(result.success).toBe(true)
    expect(result.data!.exercises![0].set_plan![1]).toEqual({ reps: 9, weight_kg: 20.5 })
  })

  it('acepta set_plan null o ausente', () => {
    expect(createRoutineBody.safeParse(body(null)).success).toBe(true)
    expect(createRoutineBody.safeParse(body(undefined)).success).toBe(true)
    expect(updateRoutineBody.safeParse(body(null)).success).toBe(true)
  })

  it.each([
    ['array vacío', []],
    ['más de 20 series', Array.from({ length: 21 }, () => ({ reps: 5, weight_kg: 10 }))],
    ['reps 0', [{ reps: 0, weight_kg: 10 }]],
    ['reps 1000', [{ reps: 1000, weight_kg: 10 }]],
    ['reps decimales', [{ reps: 8.5, weight_kg: 10 }]],
    ['peso negativo', [{ reps: 8, weight_kg: -1 }]],
    ['peso mayor de 1000', [{ reps: 8, weight_kg: 1000.5 }]],
    ['no es un array', { reps: 8, weight_kg: 10 }],
    ['reps no numérico', [{ reps: 'diez', weight_kg: 10 }]],
  ])('rechaza %s', (_label, setPlan) => {
    expect(createRoutineBody.safeParse(body(setPlan)).success).toBe(false)
  })
})
