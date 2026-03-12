import { Request, Response, NextFunction } from 'express'

/**
 * DEV MODE — always injects a fake user without validating any token.
 * This will be replaced in Module 7 with real Firebase Auth validation.
 */
export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  req.user = { id: 1, email: 'dev@test.com' }
  next()
}
