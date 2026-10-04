import { Request, Response } from 'express'
import { RoutineGeneratorService } from '../services/RoutineGeneratorService'
import { HTTP_STATUS } from '../constants/http'
import { asyncHandler } from '../utils/functions'

export const RecommendationController = {
  /** GET /api/v1/recommendations/generate — genera rutinas personalizadas */
  generate: asyncHandler(async (req: Request, res: Response) => {
    const routines = await RoutineGeneratorService.generate(req.user!.id)
    res.json({ data: routines })
  }),

  /** POST /api/v1/recommendations/accept — guarda una rutina generada */
  accept: asyncHandler(async (req: Request, res: Response) => {
    const routine = req.body
    const routineId = await RoutineGeneratorService.save(req.user!.id, routine)
    res.status(HTTP_STATUS.CREATED).json({ data: { id: routineId } })
  }),

  /** POST /api/v1/recommendations/accept-all — guarda todas las rutinas generadas */
  acceptAll: asyncHandler(async (req: Request, res: Response) => {
    const ids = await RoutineGeneratorService.saveAll(req.user!.id, req.body.routines)
    res.status(HTTP_STATUS.CREATED).json({ data: { ids } })
  }),
}
