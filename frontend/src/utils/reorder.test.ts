import { describe, it, expect } from 'vitest'
import { exerciseSummary, exercisesReorderPayload, moveItem } from './reorder'
import type { RoutineExercise } from '../types/routine'

const ex = (over: Partial<RoutineExercise>): RoutineExercise => ({
  re_id: 1, exercise_id: 10, order_index: 0, sets: 3, reps: 10, duration_seconds: null, rest_seconds: 90,
  weight_suggestion: 20, set_plan: null, notes: null, superset_group: null,
  ...over,
} as RoutineExercise)

describe('moveItem', () => {
  const list = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]
  const id = (x: { id: number }) => x.id

  it('mueve hacia abajo y hacia arriba como al soltar', () => {
    expect(moveItem(list, id, 1, 3).map(id)).toEqual([2, 3, 1, 4])
    expect(moveItem(list, id, 4, 2).map(id)).toEqual([1, 4, 2, 3])
  })

  it('devuelve la misma lista si se suelta en el sitio o fuera', () => {
    expect(moveItem(list, id, 2, 2)).toBe(list)
    expect(moveItem(list, id, 2, undefined)).toBe(list)
    expect(moveItem(list, id, 9, 2)).toBe(list)
  })

  it('no muta la lista original', () => {
    moveItem(list, id, 1, 4)
    expect(list.map(id)).toEqual([1, 2, 3, 4])
  })
})

describe('exercisesReorderPayload', () => {
  it('renumera order_index y conserva plan, descanso, notas y superserie', () => {
    const plan = [{ reps: 10, weight_kg: 20 }, { reps: 8, weight_kg: 25 }]
    const payload = exercisesReorderPayload([
      ex({ re_id: 2, exercise_id: 11, order_index: 1, sets: 2, set_plan: plan, rest_seconds: 120, notes: 'lento', superset_group: 1 }),
      ex({ re_id: 1, exercise_id: 10, order_index: 0, duration_seconds: 30, reps: null }),
    ])
    expect(payload.map(e => [e.exercise_id, e.order_index])).toEqual([[11, 0], [10, 1]])
    expect(payload[0]).toMatchObject({ set_plan: plan, rest_seconds: 120, notes: 'lento', superset_group: 1, sets: 2 })
    expect(payload[1]).toMatchObject({ duration_seconds: 30, set_plan: null })
  })
})

describe('exerciseSummary', () => {
  it('lista las reps por serie si cambian', () => {
    const plan = [10, 9, 8, 7].map(reps => ({ reps, weight_kg: 20 }))
    expect(exerciseSummary(ex({ sets: 4, set_plan: plan }), 'series')).toBe('4 series · 10-9-8-7')
  })

  it('una sola cifra si todas las series piden lo mismo', () => {
    expect(exerciseSummary(ex({ sets: 3, reps: 12 }), 'series')).toBe('3 series · 12')
  })

  it('por tiempo enseña la duración', () => {
    expect(exerciseSummary(ex({ sets: 3, reps: null, duration_seconds: 30 }), 'series')).toBe('3 series · 30 s')
  })

  it('sin reps solo las series', () => {
    expect(exerciseSummary(ex({ sets: 2, reps: null }), 'series')).toBe('2 series')
  })
})
