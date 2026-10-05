export interface GeneratedExercise {
  exercise_id: number
  exercise_name: string
  sets: number
  reps: number | null
  duration_seconds: number | null
  rest_seconds: number
  order_index: number
}

export interface GeneratedRoutine {
  name: string
  description: string
  goal: string
  difficulty: string
  estimated_duration_min: number
  warmup_notes: string
  cooldown_notes: string
  day_label: string
  exercises: GeneratedExercise[]
}
