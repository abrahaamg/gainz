export const DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const

export const CATEGORIES = ['strength', 'cardio', 'hiit', 'flexibility', 'balance'] as const
export type Category = (typeof CATEGORIES)[number]

export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'] as const
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number]

export const FITNESS_LEVELS = ['beginner', 'intermediate', 'advanced'] as const
export type FitnessLevel = (typeof FITNESS_LEVELS)[number]

export const ROUTINE_GOALS = ['strength', 'hypertrophy', 'endurance', 'flexibility', 'weight_loss', 'general'] as const
export type RoutineGoal = (typeof ROUTINE_GOALS)[number]

export const SESSION_STATUS = ['active', 'completed', 'abandoned'] as const
export type SessionStatus = (typeof SESSION_STATUS)[number]

export const EQUIPMENT_TYPES = ['free_weights', 'machines', 'accessories', 'cardio'] as const
export type EquipmentType = (typeof EQUIPMENT_TYPES)[number]

export const EQUIPMENT_LOCATIONS = ['gym', 'home', 'outdoor'] as const
export type EquipmentLocation = (typeof EQUIPMENT_LOCATIONS)[number]
