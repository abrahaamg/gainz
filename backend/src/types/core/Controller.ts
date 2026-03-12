import { Request, Response, NextFunction } from 'express'

export interface IController {
  getAll(req: Request, res: Response, next: NextFunction): Promise<void>
  getById(req: Request, res: Response, next: NextFunction): Promise<void>
  create(req: Request, res: Response, next: NextFunction): Promise<void>
  update(req: Request, res: Response, next: NextFunction): Promise<void>
  delete(req: Request, res: Response, next: NextFunction): Promise<void>
}
