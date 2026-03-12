/**
 * Wraps async route handlers to forward errors to Express error middleware
 */
import { Request, Response, NextFunction, RequestHandler } from 'express'

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>

export const asyncHandler = (fn: AsyncHandler): RequestHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}

/**
 * Filters out undefined/null values from an object (useful for dynamic UPDATE queries)
 */
export const filterDefinedFields = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined && value !== null)
  ) as Partial<T>
}

/**
 * Builds a parameterized SET clause for SQL UPDATE statements
 * Returns { clause: "col1 = $1, col2 = $2", values: [...] }
 */
export const buildSetClause = (
  fields: Record<string, unknown>
): { clause: string; values: unknown[] } => {
  const entries = Object.entries(fields)
  const clause = entries.map(([col], i) => `${col} = $${i + 1}`).join(', ')
  const values = entries.map(([, v]) => v)
  return { clause, values }
}
