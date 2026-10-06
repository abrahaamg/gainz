import { describe, it, expect } from 'vitest'
import { routineToCopyPayload } from './duplicateRoutine'
import type { Routine, RoutineExercise } from '../types/routine'

const routine = {
  id: 7, user_id: 1, name: 'Día 1', description: 'Importada', goal: null, difficulty: 'medium',
  estimated_duration_min: 50, warmup_notes: null, cooldown_notes: null, is_public: true,
  times_completed: 4, tags: [], is_hidden: false, position: null, created_at: '', updated_at: '',
} as Routine

const ex = (over: Partial<RoutineExercise>): RoutineExercise => ({
  re_id: 1, exercise_id: 10, order_index: 0, sets: 3, reps: 10, duration_seconds: null, rest_seconds: 90,
  weight_suggestion: 20, set_plan: null, notes: null, superset_group: null,
  ...over,
} as RoutineExercise)

describe('routineToCopyPayload', () => {
  it('copia el set_plan por serie, las notas y el orden', () => {
    const plan = [{ reps: 9, weight_kg: 62 }, { reps: 8, weight_kg: 57 }]
    const payload = routineToCopyPayload(routine, [
      ex({ re_id: 2, exercise_id: 11, order_index: 1, sets: 2, set_plan: plan, notes: 'subir' }),
      ex({ re_id: 1, exercise_id: 10, order_index: 0 }),
    ], ' (copia)')
    expect(payload.name).toBe('Día 1 (copia)')
    expect(payload.is_public).toBe(false)
    expect(payload.exercises.map(e => e.exercise_id)).toEqual([10, 11])
    expect(payload.exercises[1].set_plan).toEqual(plan)
    expect(payload.exercises[1].notes).toBe('subir')
  })

  it('rutina antigua sin set_plan: lo deriva de series/reps/peso', () => {
    const payload = routineToCopyPayload(routine, [ex({})], ' (copia)')
    expect(payload.exercises[0].set_plan).toEqual(Array(3).fill({ reps: 10, weight_kg: 20 }))
  })

  it('ejercicio por duración: sin plan', () => {
    const payload = routineToCopyPayload(routine, [ex({ duration_seconds: 45, reps: null })], ' (copia)')
    expect(payload.exercises[0].set_plan).toBeNull()
    expect(payload.exercises[0].duration_seconds).toBe(45)
  })
})
