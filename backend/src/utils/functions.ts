/**
 * Wraps async route handlers to forward errors to Express error middleware
 */
import { Request, Response, NextFunction } from 'express'

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>

export type RouteHandler = (req: Request, res: Response, next: NextFunction) => void

export const asyncHandler = (fn: AsyncHandler): RouteHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}
