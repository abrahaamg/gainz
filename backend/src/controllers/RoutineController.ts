import { Request, Response, NextFunction } from 'express'
import { RoutineService } from '../services/RoutineService'
import { HTTP_STATUS } from '../constants/http'

export const RoutineController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const routines = await RoutineService.getAll(req.user!.id)
      res.json({ data: routines })
    } catch (err) {
      next(err)
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await RoutineService.getById(Number(req.params.id), req.user!.id)
      res.json({ data: { ...result.routine, exercises: result.exercises } })
    } catch (err) {
      next(err)
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await RoutineService.create(req.user!.id, req.body)
      res.status(HTTP_STATUS.CREATED).json({ data: { ...result.routine, exercises: result.exercises } })
    } catch (err) {
      next(err)
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await RoutineService.update(Number(req.params.id), req.user!.id, req.body)
      res.json({ data: { ...result.routine, exercises: result.exercises } })
    } catch (err) {
      next(err)
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await RoutineService.delete(Number(req.params.id), req.user!.id)
      res.json({ data: { deleted: true } })
    } catch (err) {
      next(err)
    }
  },
}
