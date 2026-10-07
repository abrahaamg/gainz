import { z } from 'zod'
import { limitQuery, numeric, optionalText, positiveInt, flexBool } from './common'

export const createSessionBody = z.object({
  routine_id: positiveInt,
})

export const listSessionsQuery = z.looseObject({
  limit: limitQuery,
})

export const addSetBody = z.object({
  exercise_id: positiveInt,
  set_number: positiveInt,
  reps_done: numeric(z.number().int().min(0).nullable()).optional(),
  weight_kg: numeric(z.number().min(0).max(9999).nullable()).optional(),
  duration_done_sec: numeric(z.number().int().min(0).nullable()).optional(),
  rpe: numeric(z.number().min(1).max(10).nullable()).optional(),
  notes: optionalText(),
  completed: flexBool().optional(),
})

export const finishSessionBody = z.object({
  status: z.enum(['completed', 'abandoned']),
  notes: optionalText(),
  rating: numeric(z.number().int().min(1).max(5).nullable()).optional(),
  duration_seconds: numeric(z.number().int().min(0)),
})
