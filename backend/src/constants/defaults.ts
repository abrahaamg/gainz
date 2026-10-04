export const DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const

// Usados por los schemas de zod de ejercicios
export const CATEGORIES = ['strength', 'cardio', 'hiit', 'flexibility', 'balance'] as const

export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'] as const
