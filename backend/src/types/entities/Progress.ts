export interface FrequencyPoint {
  date: string
  sessions: number
}

export interface VolumePoint {
  date: string
  volume_kg: number
}

export interface DurationPoint {
  date: string
  duration_min: number
}

export interface MusclePoint {
  muscle_group: string
  sets: number
}

export interface ProgressionPoint {
  date: string
  value: number
}

export interface PersonalRecord {
  id: number
  exercise_id: number
  exercise_name: string
  record_type: 'max_weight' | 'max_reps' | 'max_duration'
  value: number
  achieved_at: string
}

export interface StreakStats {
  current_streak: number
  longest_streak: number
  total_workouts: number
  total_minutes: number
  last_workout_date: string | null
}

export interface Badge {
  id: string
  label: string
  description: string
  icon: string
  earned: boolean
}

export interface ExerciseOption {
  id: number
  name: string
}
