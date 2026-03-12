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

  // Unexpected errors
  console.error('Unexpected error:', err)
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  })
}
