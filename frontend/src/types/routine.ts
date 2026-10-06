/** Objetivo de una serie concreta. */
export interface SetPlanEntry {
  reps: number | null
  weight_kg: number | null
}

export interface RoutineExercise {
  re_id: number
  exercise_id: number
  order_index: number
  sets: number
  reps: number | null
  duration_seconds: number | null
  rest_seconds: number
  weight_suggestion: number | null
  /** Una entrada por serie; null en rutinas antiguas (entonces valen reps/weight_suggestion). */
  set_plan: SetPlanEntry[] | null
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
  /** El usuario la ha quitado de su lista (solo rutinas públicas ajenas). */
  is_hidden: boolean
  /** Orden manual del usuario en su lista; null = sin colocar (sale arriba). */
  position: number | null
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
  /** Plan por serie; null = ejercicio por duración o sin plan. */
  set_plan: SetPlanEntry[] | null
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
    set_plan?: SetPlanEntry[] | null
    notes: string | null
    superset_group: number | null
  }[]
}
