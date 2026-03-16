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
  routine_name?: string
  exercises?: SessionExercise[]
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
  notes: string | null   // NIVEL 3: nota por serie durante ejecución
  completed: boolean
  completed_at: string | null
  exercise_name?: string
  category?: string
  muscle_group?: string
}

export interface AddSetPayload {
  exercise_id: number
  set_number: number
  reps_done?: number | null
  weight_kg?: number | null
  duration_done_sec?: number | null
  rpe?: number | null
  notes?: string | null
}

export interface FinishSessionPayload {
  status: 'completed' | 'abandoned'
  notes?: string | null
  rating?: number | null
  duration_seconds: number
}
