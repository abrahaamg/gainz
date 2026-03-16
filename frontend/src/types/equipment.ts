export interface Equipment {
  id: number
  user_id: number
  name: string
  category: string | null   // free_weights | machines | cardio | bodyweight | accessories
  quantity: number
  weight_kg: number | null
  location: string           // home | gym | outdoor
  notes: string | null
}

export interface CreateEquipmentPayload {
  name: string
  category?: string | null
  quantity?: number
  weight_kg?: number | null
  location?: string
  notes?: string | null
}

export interface Recommendation {
  id: number
  name: string
  description: string | null
  goal: string | null
  difficulty: string
  estimated_duration_min: number | null
  times_completed: number
  total_exercises: number
  compatible_exercises: number
  compatibility_pct: number
}
