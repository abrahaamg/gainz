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
  exercise_count?: number
}

export interface RoutineExerciseForm {
  id: string          // client-side uuid para dnd-kit key
  exercise_id: number
  order_index: number
  sets: number
  reps: number | null
  duration_seconds: number | null
  rest_seconds: number
  weight_suggestion: number | null
  notes: string
  superset_group: number | null
  // display only
  exercise_name: string
  category: string
  muscle_group: string
}

export interface CreateRoutinePayload {
  name: string
  description?: string | null
  goal?: string | null
  difficulty?: string
  estimated_duration_min?: number | null
  warmup_notes?: string | null
  cooldown_notes?: string | null
  is_public?: boolean
  tags?: string[]
  exercises: {
    exercise_id: number
    order_index: number
    sets: number
    reps: number | null
    duration_seconds: number | null
    rest_seconds: number
    weight_suggestion: number | null
    notes: string | null
    superset_group: number | null
  }[]
}
