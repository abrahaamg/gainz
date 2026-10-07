import { z } from 'zod'
import { CATEGORIES, DIFFICULTY_LEVELS } from '../constants'
import { limitQuery, optionalText, positiveInt, flexBool } from './common'

export const createExerciseBody = z.object({
  name: z.string().trim().min(1).max(150),
  category: z.enum(CATEGORIES),
  muscle_group: z.string().trim().min(1).max(100),
  secondary_muscles: z.array(z.string().max(100)).optional(),
  description: optionalText(),
  instructions: optionalText(),
  difficulty: z.enum(DIFFICULTY_LEVELS).optional(),
  video_url: optionalText(500),
  image_url: optionalText(500),
  requires_equipment: flexBool().optional(),
  is_unilateral: flexBool().optional(),
  notes: optionalText(),
  is_public: flexBool().optional(),
  equipment: z.array(z.string().trim().min(1).max(100)).optional(),
})

export const updateExerciseBody = createExerciseBody.partial()

// El resto de filtros (category, muscle, q...) se dejan pasar tal cual
export const listExercisesQuery = z.looseObject({
  page: positiveInt.optional(),
  limit: limitQuery,
})
