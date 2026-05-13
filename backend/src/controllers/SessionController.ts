import { Request, Response, NextFunction } from 'express'
import { SessionService } from '../services/SessionService'
import { HTTP_STATUS } from '../constants/http'

export const SessionController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = await SessionService.create(req.user!.id, Number(req.body.routine_id))
      res.status(HTTP_STATUS.CREATED).json({ data: { id: sessionId } })
    } catch (err) { next(err) }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await SessionService.getById(Number(req.params.id), req.user!.id)
      res.json({ data: { ...result.session, exercises: result.exercises } })
    } catch (err) { next(err) }
  },

  getByUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 20
      const sessions = await SessionService.getByUser(req.user!.id, limit)
      res.json({ data: sessions })
    } catch (err) { next(err) }
  },

  getLastPerformance: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await SessionService.getLastPerformance(
        req.user!.id,
        Number(req.params.exerciseId)
      )
      res.json({ data: result })
    } catch (err) { next(err) }
  },

  addSet: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await SessionService.addSet(
        Number(req.params.id),
        req.user!.id,
        req.body
      )
      res.status(HTTP_STATUS.CREATED).json({ data: result })
    } catch (err) { next(err) }
  },

  finish: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await SessionService.finish(
        Number(req.params.id),
        req.user!.id,
        req.body
      )
      res.json({ data: { ...result.session, exercises: result.exercises } })
    } catch (err) { next(err) }
  },
}
