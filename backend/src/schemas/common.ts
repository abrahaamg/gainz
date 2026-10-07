import { z } from 'zod'
import { DEFAULTS } from '../constants'

// Los números pueden llegar como string (params, query o inputs de formulario)
const toNumber = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() !== '' ? Number(value) : value

export const numeric = <T extends z.ZodType>(schema: T) => z.preprocess(toNumber, schema)

export const positiveInt = numeric(z.number().int().positive())

export const idParams = z.object({ id: positiveInt })

export const exerciseIdParams = z.object({ exerciseId: positiveInt })

export const limitQuery = numeric(z.number().int().min(1).max(DEFAULTS.MAX_LIMIT)).optional()

// Texto opcional que admite null
export const optionalText = (max?: number) =>
  (max ? z.string().max(max) : z.string()).nullable().optional()

/**
 * Booleano que acepta también 0/1: MySQL guarda los booleanos como TINYINT y el
 * frontend a veces reenvía el valor tal como lo leyó.
 */
export const flexBool = () =>
  z.union([z.boolean(), z.literal(0), z.literal(1)]).transform(v => Boolean(v))
