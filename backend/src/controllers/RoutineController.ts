import { Request, Response } from 'express'
import { RoutineService } from '../services/RoutineService'
import { HTTP_STATUS } from '../constants/http'
import { asyncHandler } from '../utils/functions'

export const RoutineController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    // validate() ya ha convertido include_hidden a boolean
    const { include_hidden: includeHidden } = req.query as unknown as { include_hidden: boolean }
    const routines = await RoutineService.getAll(req.user!.id, { includeHidden })
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

  hide: asyncHandler(async (req: Request, res: Response) => {
    await RoutineService.hide(Number(req.params.id), req.user!.id)
    res.json({ data: { hidden: true } })
  }),

  unhide: asyncHandler(async (req: Request, res: Response) => {
    await RoutineService.unhide(Number(req.params.id), req.user!.id)
    res.json({ data: { hidden: false } })
  }),

  reorder: asyncHandler(async (req: Request, res: Response) => {
    const { routine_ids: routineIds } = req.body as { routine_ids: number[] }
    await RoutineService.reorder(req.user!.id, routineIds)
    res.json({ data: { routine_ids: routineIds } })
  }),
}
