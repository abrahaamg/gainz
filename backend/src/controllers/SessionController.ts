import { Request, Response } from 'express'
import { SessionService } from '../services/SessionService'
import { HTTP_STATUS } from '../constants/http'
import { asyncHandler } from '../utils/functions'

export const SessionController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const sessionId = await SessionService.create(req.user!.id, Number(req.body.routine_id))
    res.status(HTTP_STATUS.CREATED).json({ data: { id: sessionId } })
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const result = await SessionService.getById(Number(req.params.id), req.user!.id)
    res.json({ data: { ...result.session, exercises: result.exercises } })
  }),

  getByUser: asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 20
    const sessions = await SessionService.getByUser(req.user!.id, limit)
    res.json({ data: sessions })
  }),

  getLastPerformance: asyncHandler(async (req: Request, res: Response) => {
    const result = await SessionService.getLastPerformance(
      req.user!.id,
      Number(req.params.exerciseId)
    )
    res.json({ data: result })
  }),

  addSet: asyncHandler(async (req: Request, res: Response) => {
    const result = await SessionService.addSet(
      Number(req.params.id),
      req.user!.id,
      req.body
    )
    res.status(HTTP_STATUS.CREATED).json({ data: result })
  }),

  finish: asyncHandler(async (req: Request, res: Response) => {
    const result = await SessionService.finish(
      Number(req.params.id),
      req.user!.id,
      req.body
    )
    res.json({ data: { ...result.session, exercises: result.exercises } })
  }),
}
