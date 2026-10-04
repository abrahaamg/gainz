import { Request, Response, NextFunction, RequestHandler } from 'express'
import { z } from 'zod'
import { BadRequestError } from '../utils/customErrors'

interface RequestSchemas {
  body?: z.ZodType
  params?: z.ZodType
  query?: z.ZodType
}

/**
 * Valida body, params y query con zod antes de llegar al controlador.
 * Si algo no cuadra responde 400; si cuadra, sustituye cada parte por su
 * versión parseada (números convertidos y campos desconocidos eliminados).
 */
export const validate = (schemas: RequestSchemas): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    const issues: string[] = []

    for (const part of ['params', 'query', 'body'] as const) {
      const schema = schemas[part]
      if (!schema) continue
      const result = schema.safeParse(req[part])
      if (result.success) {
        req[part] = result.data as never
      } else {
        for (const issue of result.error.issues) {
          const path = [part, ...issue.path.map(String)].join('.')
          issues.push(`${path}: ${issue.message}`)
        }
      }
    }

    if (issues.length) {
      next(new BadRequestError(`Datos no válidos — ${issues.join('; ')}`))
      return
    }
    next()
  }
