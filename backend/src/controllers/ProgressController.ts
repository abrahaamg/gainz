import { Request, Response } from 'express'
import { ProgressService } from '../services/ProgressService'
import { asyncHandler } from '../utils/functions'

export const ProgressController = {
  // GET /api/v1/progress/charts?days=30
  getCharts: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id
    const days   = Math.min(Number(req.query.days) || 30, 365)
    const data   = await ProgressService.getCharts(userId, days)
    res.json({ data })
  }),

  // GET /api/v1/progress/exercises
  getTrainedExercises: asyncHandler(async (req: Request, res: Response) => {
    const data = await ProgressService.getTrainedExercises(req.user!.id)
    res.json({ data })
  }),

  // GET /api/v1/progress/progression/:exerciseId
  getExerciseProgression: asyncHandler(async (req: Request, res: Response) => {
    const data = await ProgressService.getExerciseProgression(
      req.user!.id,
      Number(req.params.exerciseId)
    )
    res.json({ data })
  }),

  // GET /api/v1/progress/1rm/:exerciseId
  get1RMProgression: asyncHandler(async (req: Request, res: Response) => {
    const data = await ProgressService.get1RMProgression(
      req.user!.id,
      Number(req.params.exerciseId)
    )
    res.json({ data })
  }),

  // GET /api/v1/progress/records
  getRecords: asyncHandler(async (req: Request, res: Response) => {
    const data = await ProgressService.getRecords(req.user!.id)
    res.json({ data })
  }),

  // GET /api/v1/progress/stats
  getStats: asyncHandler(async (req: Request, res: Response) => {
    const data = await ProgressService.getStats(req.user!.id)
    res.json({ data })
  }),
}
