import { z } from 'zod'
import { numeric, optionalText } from './common'

const optionalNumber = (min: number, max: number) =>
  numeric(z.number().min(min).max(max).nullable()).optional()

const optionalStringList = z.array(z.string().max(50)).nullable().optional()

export const updateMeBody = z.object({
  username: z.string().trim().min(1).max(100).nullable().optional(),
  sex: optionalText(20),
  age: numeric(z.number().int().min(0).max(150).nullable()).optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado AAAA-MM-DD').nullable().optional(),
  fitness_level: optionalText(20),
  experience: optionalText(20),
  weight_kg: optionalNumber(0, 999),
  height_cm: optionalNumber(0, 999),
  goals: optionalStringList,
  primary_goal: optionalText(50),
  available_days: optionalStringList,
  session_duration_min: numeric(z.number().int().min(0).max(1440).nullable()).optional(),
  injuries: optionalStringList,
  onboarding_done: z.boolean().optional(),
  avatar_url: optionalText(500),
})
