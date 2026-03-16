import { Request, Response, NextFunction } from 'express'
import { ProgressService } from '../services/ProgressService'

export const ProgressController = {
  // GET /api/v1/progress/charts?days=30
  getCharts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id
      const days   = Math.min(Number(req.query.days) || 30, 365)
      const data   = await ProgressService.getCharts(userId, days)
      res.json({ data })
    } catch (err) { next(err) }
  },

  // GET /api/v1/progress/exercises
  getTrainedExercises: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await ProgressService.getTrainedExercises(req.user.id)
      res.json({ data })
    } catch (err) { next(err) }
  },

  // GET /api/v1/progress/progression/:exerciseId
  getExerciseProgression: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await ProgressService.getExerciseProgression(
        req.user.id,
        Number(req.params.exerciseId)
      )
      res.json({ data })
    } catch (err) { next(err) }
  },

  // GET /api/v1/progress/records
  getRecords: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await ProgressService.getRecords(req.user.id)
      res.json({ data })
    } catch (err) { next(err) }
  },

  // GET /api/v1/progress/stats
  getStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await ProgressService.getStats(req.user.id)
      res.json({ data })
    } catch (err) { next(err) }
  },
}
