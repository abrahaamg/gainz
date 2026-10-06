import { z } from 'zod'
import { numeric, optionalText, positiveInt } from './common'

const optionalInt = (min = 0) => numeric(z.number().int().min(min).nullable()).optional()

// Plan por serie: una entrada por serie con sus reps y su peso
const setPlanEntry = z.object({
  reps: numeric(z.number().int().min(1).max(999).nullable()),
  weight_kg: numeric(z.number().min(0).max(1000).nullable()),
})

const setPlan =z.array(setPlanEntry).min(1).max(20).nullable().optional()

const routineExercise = z.object({
  exercise_id: positiveInt,
  order_index: numeric(z.number().int().min(0)),
  sets: numeric(z.number().int().min(1)).optional(),
  reps: optionalInt(),
  duration_seconds: optionalInt(),
  rest_seconds: numeric(z.number().int().min(0)).optional(),
  weight_suggestion: numeric(z.number().min(0).nullable()).optional(),
  set_plan: setPlan,
  notes: optionalText(),
  superset_group: optionalInt(),
})

export const createRoutineBody = z.object({
  name: z.string().trim().min(1).max(150),
  description: optionalText(),
  goal: optionalText(30),
  difficulty: z.string().max(10).optional(),
  estimated_duration_min: optionalInt(),
  warmup_notes: optionalText(),
  cooldown_notes: optionalText(),
  is_public: z.boolean().optional(),
  tags: z.array(z.string().max(50)).optional(),
  exercises: z.array(routineExercise).optional(),
})

export const updateRoutineBody = createRoutineBody.partial()

// ─── Rutinas generadas por el recomendador ───────────────────
const generatedExercise = routineExercise.extend({
  sets: numeric(z.number().int().min(1)),
  rest_seconds: numeric(z.number().int().min(0)),
  reps: numeric(z.number().int().min(0).nullable()),
  duration_seconds: numeric(z.number().int().min(0).nullable()),
})

export const generatedRoutineBody = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string(),
  goal: z.string().max(30),
  difficulty: z.string().max(10),
  estimated_duration_min: numeric(z.number().int().min(0)),
  warmup_notes: z.string(),
  cooldown_notes: z.string(),
  day_label: z.string(),
  exercises: z.array(generatedExercise),
})

export const acceptAllBody = z.object({
  routines: z.array(generatedRoutineBody).min(1),
})
