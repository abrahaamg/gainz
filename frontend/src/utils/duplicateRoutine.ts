import { routineService } from '../services/routineService'
import type { CreateRoutinePayload, Routine, RoutineExercise } from '../types/routine'
import { planFromExercise } from './setPlan'

/** Payload de una copia exacta de la rutina (ejercicios con su plan por serie y notas). */
export function routineToCopyPayload(routine: Routine, exercises: RoutineExercise[], copySuffix: string): CreateRoutinePayload {
  const ordered = [...exercises].sort((a, b) => a.order_index - b.order_index)
  return {
    name: `${routine.name}${copySuffix}`.slice(0, 150),
    description: routine.description,
    goal: routine.goal,
    difficulty: routine.difficulty,
    estimated_duration_min: routine.estimated_duration_min,
    warmup_notes: routine.warmup_notes,
    cooldown_notes: routine.cooldown_notes,
    is_public: false,
    tags: routine.tags ?? [],
    exercises: ordered.map((ex, i) => ({
      exercise_id: ex.exercise_id,
      order_index: i,
      sets: ex.sets,
      reps: ex.reps,
      duration_seconds: ex.duration_seconds,
      rest_seconds: ex.rest_seconds,
      weight_suggestion: ex.weight_suggestion,
      // Por duración no hay plan; en rutinas antiguas el plan se deriva de reps/peso
      set_plan: ex.duration_seconds !== null ? null : planFromExercise(ex),
      notes: ex.notes,
      superset_group: ex.superset_group,
    })),
  }
}

/** Duplica una rutina (copia editable, privada). Si no trae ejercicios, los pide al backend. */
export async function duplicateRoutine(routine: Routine, copySuffix: string): Promise<Routine> {
  const full = routine.exercises ? routine : await routineService.getById(routine.id)
  return routineService.create(routineToCopyPayload(full, full.exercises ?? [], copySuffix))
}
