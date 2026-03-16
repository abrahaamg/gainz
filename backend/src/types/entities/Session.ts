export interface Session {
  id: number
  user_id: number
  routine_id: number | null
  started_at: string
  finished_at: string | null
  duration_seconds: number | null
  calories_burned: number | null
  notes: string | null
  rating: number | null
  status: 'in_progress' | 'completed' | 'abandoned'
  // joined
  routine_name?: string
}

export interface SessionExercise {
  id: number
  session_id: number
  exercise_id: number
  set_number: number
  reps_done: number | null
  weight_kg: number | null
  duration_done_sec: number | null
  rpe: number | null
  notes: string | null   // NIVEL 3: nota del usuario por serie durante ejecución
  completed: boolean
  completed_at: string | null
  // joined
  exercise_name?: string
  category?: string
  muscle_group?: string
}

export interface AddSetDTO {
  exercise_id: number
  set_number: number
  reps_done?: number | null
  weight_kg?: number | null
  duration_done_sec?: number | null
  rpe?: number | null
  notes?: string | null
  completed?: boolean
}

export interface FinishSessionDTO {
  status: 'completed' | 'abandoned'
  notes?: string | null
  rating?: number | null
  duration_seconds: number
}
