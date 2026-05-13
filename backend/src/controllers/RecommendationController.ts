import { Request, Response, NextFunction } from 'express'
import { RoutineGeneratorService } from '../services/RoutineGeneratorService'
import { HTTP_STATUS } from '../constants/http'

export const RecommendationController = {
  /** GET /api/v1/recommendations/generate — genera rutinas personalizadas */
  generate: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const routines = await RoutineGeneratorService.generate(req.user!.id)
      res.json({ data: routines })
    } catch (err) { next(err) }
  },

  /** POST /api/v1/recommendations/accept — guarda una rutina generada */
  accept: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const routine = req.body
      const routineId = await RoutineGeneratorService.save(req.user!.id, routine)
      res.status(HTTP_STATUS.CREATED).json({ data: { id: routineId } })
    } catch (err) { next(err) }
  },

  /** POST /api/v1/recommendations/accept-all — guarda todas las rutinas generadas */
  acceptAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { routines } = req.body
      const ids: number[] = []
      for (const routine of routines) {
        const id = await RoutineGeneratorService.save(req.user!.id, routine)
        ids.push(id)
      }
      res.status(HTTP_STATUS.CREATED).json({ data: { ids } })
    } catch (err) { next(err) }
  },
}
