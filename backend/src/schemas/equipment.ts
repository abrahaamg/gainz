import { z } from 'zod'
import { numeric, optionalText, positiveInt } from './common'

export const createEquipmentBody = z.object({
  name: z.string().trim().min(1).max(100),
  catalog_name: optionalText(100),
  category: optionalText(30),
  quantity: numeric(z.number().int().min(1)).optional(),
  weight_kg: numeric(z.number().min(0).max(9999).nullable()).optional(),
  location: z.string().max(20).optional(),
  notes: optionalText(),
  exercise_ids: z.array(positiveInt).optional(),
})
