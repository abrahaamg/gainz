import { Request, Response } from 'express'
import { RoutineService } from '../services/RoutineService'
import { HTTP_STATUS } from '../constants/http'
import { asyncHandler } from '../utils/functions'

export const RoutineController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const routines = await RoutineService.getAll(req.user!.id)
    res.json({ data: routines })
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const result = await RoutineService.getById(Number(req.params.id), req.user!.id)
    res.json({ data: { ...result.routine, exercises: result.exercises } })
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const result = await RoutineService.create(req.user!.id, req.body)
    res.status(HTTP_STATUS.CREATED).json({ data: { ...result.routine, exercises: result.exercises } })
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const result = await RoutineService.update(Number(req.params.id), req.user!.id, req.body)
    res.json({ data: { ...result.routine, exercises: result.exercises } })
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await RoutineService.delete(Number(req.params.id), req.user!.id)
    res.json({ data: { deleted: true } })
  }),
}
