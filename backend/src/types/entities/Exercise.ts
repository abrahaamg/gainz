export interface Exercise {
  id: number
  name: string
  category: 'cardio' | 'strength' | 'flexibility' | 'hiit' | 'balance'
  muscle_group: string
  secondary_muscles: string[]
  description: string | null
  instructions: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  video_url: string | null
  image_url: string | null
  requires_equipment: boolean
  is_unilateral: boolean
  notes: string | null        // NIVEL 1: nota del creador del ejercicio
  created_by: number | null
  is_public: boolean
  created_at: string
  equipment?: string[]        // nombres de equipo requerido (JOIN con exercise_equipment)
}

export interface CreateExerciseDTO {
  name: string
  category: Exercise['category']
  muscle_group: string
  secondary_muscles?: string[]
  description?: string
  instructions?: string
  difficulty?: Exercise['difficulty']
  video_url?: string
  image_url?: string
  requires_equipment?: boolean
  is_unilateral?: boolean
  notes?: string
  is_public?: boolean
  equipment?: string[]        // equipamiento requerido
}

export type UpdateExerciseDTO = Partial<CreateExerciseDTO>

export interface ExerciseFilters {
  category?: string
  muscle?: string
  difficulty?: string
  requires_equipment?: boolean
  q?: string
  page?: number
  limit?: number
}
