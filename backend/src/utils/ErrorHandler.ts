import { Request, Response, NextFunction } from 'express'
import { AppError } from './customErrors'

export const ErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    })
    return
  }

  // Borrado bloqueado por una FK sin ON DELETE (p. ej. un ejercicio usado en
  // session_exercises o exercise_1rm_history): es un conflicto, no un 500.
  const code = (err as { code?: string }).code
  if (code === 'ER_ROW_IS_REFERENCED' || code === 'ER_ROW_IS_REFERENCED_2') {
    res.status(409).json({
      status: 'error',
      message: 'No se puede eliminar porque hay datos que dependen de este registro',
    })
    return
  }

  // Unexpected errors
  console.error('Unexpected error:', err)
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  })
}
