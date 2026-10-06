import type { Difficulty, ExerciseCategory } from '../types/exercise'

// Mismos valores que el formulario de ejercicios (ExerciseFormPage).
export const EXERCISE_CATEGORIES: ExerciseCategory[] = ['strength', 'cardio', 'flexibility', 'hiit', 'balance']

export const EXERCISE_MUSCLE_GROUPS = [
  'chest', 'lats', 'upper_back',
  'quadriceps', 'hamstrings', 'glutes', 'calves',
  'shoulders', 'biceps', 'triceps', 'forearms',
  'core', 'full_body',
]

export const EXERCISE_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']
