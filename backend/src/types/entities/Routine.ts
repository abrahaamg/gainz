export interface RoutineExercise {
  re_id: number
  exercise_id: number
  order_index: number
  sets: number
  reps: number | null
  duration_seconds: number | null
  rest_seconds: number
  weight_suggestion: number | null
  notes: string | null          // NIVEL 2: nota del creador de la rutina
  superset_group: number | null
  // joined from exercises
  exercise_name: string
  category: string
  muscle_group: string
  secondary_muscles: string[]
  description: string | null
  instructions: string | null
  difficulty: string
  requires_equipment: boolean
  is_unilateral: boolean
  exercise_notes: string | null // NIVEL 1: nota del creador del ejercicio
}

export interface Routine {
  id: number
  user_id: number
  name: string
  description: string | null
  goal: string | null
  difficulty: string
  estimated_duration_min: number | null
  warmup_notes: string | null
  cooldown_notes: string | null
  is_public: boolean
  times_completed: number
  tags: string[]
  created_at: string
  updated_at: string
  exercises?: RoutineExercise[]
}

export interface CreateRoutineExerciseDTO {
  exercise_id: number
  order_index: number
  sets: number
  reps?: number | null
  duration_seconds?: number | null
  rest_seconds?: number
  weight_suggestion?: number | null
  notes?: string | null
  superset_group?: number | null
}

export interface CreateRoutineDTO {
  name: string
  description?: string | null
  goal?: string | null
  difficulty?: string
  estimated_duration_min?: number | null
  warmup_notes?: string | null
  cooldown_notes?: string | null
  is_public?: boolean
  tags?: string[]
  exercises: CreateRoutineExerciseDTO[]
}

export interface UpdateRoutineDTO extends Partial<Omit<CreateRoutineDTO, 'exercises'>> {
  exercises?: CreateRoutineExerciseDTO[]
}
