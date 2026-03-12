export type ExerciseCategory = 'cardio' | 'strength' | 'flexibility' | 'hiit' | 'balance'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Exercise {
  id: number
  name: string
  category: ExerciseCategory
  muscle_group: string
  secondary_muscles: string[]
  description: string | null
  instructions: string | null
  difficulty: Difficulty
  video_url: string | null
  image_url: string | null
  requires_equipment: boolean
  is_unilateral: boolean
  notes: string | null
  created_by: number | null
  is_public: boolean
  created_at: string
  equipment: string[]
}

export interface ExerciseFilters {
  category?: ExerciseCategory
  muscle?: string
  difficulty?: Difficulty
  requires_equipment?: boolean
  q?: string
  page?: number
  limit?: number
}

export interface CreateExerciseDTO {
  name: string
  category: ExerciseCategory
  muscle_group: string
  secondary_muscles?: string[]
  description?: string
  instructions?: string
  difficulty?: Difficulty
  video_url?: string
  image_url?: string
  requires_equipment?: boolean
  is_unilateral?: boolean
  notes?: string
  is_public?: boolean
  equipment?: string[]
}

export type UpdateExerciseDTO = Partial<CreateExerciseDTO>

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedExercises {
  data: Exercise[]
  pagination: Pagination
}
