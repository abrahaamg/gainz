import { Request, Response } from 'express'
import { EquipmentService } from '../services/EquipmentService'
import { HTTP_STATUS } from '../constants/http'
import { asyncHandler } from '../utils/functions'

export const EquipmentController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const [items, accessibleCount, bodyweightCount] = await Promise.all([
      EquipmentService.getAll(req.user!.id),
      EquipmentService.countAccessible(req.user!.id),
      EquipmentService.countBodyweight(),
    ])
    res.json({ data: items, accessible_exercises: accessibleCount, bodyweight_exercises: bodyweightCount })
  }),

  getCatalog: asyncHandler(async (_req: Request, res: Response) => {
    const catalog = await EquipmentService.getCatalog()
    res.json({ data: catalog })
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const { exercise_ids, ...data } = req.body
    let item
    if (exercise_ids?.length) {
      item = await EquipmentService.createWithExercises(req.user!.id, data, exercise_ids)
    } else {
      item = await EquipmentService.create(req.user!.id, data)
    }
    res.status(HTTP_STATUS.CREATED).json({ data: item })
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await EquipmentService.update(Number(req.params.id), req.user!.id, req.body)
    res.json({ data: item })
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await EquipmentService.delete(Number(req.params.id), req.user!.id)
    res.json({ data: { deleted: true } })
  }),

  getAccessibleExercises: asyncHandler(async (req: Request, res: Response) => {
    const exercises = await EquipmentService.findAccessible(req.user!.id)
    res.json({ data: exercises })
  }),

  getRecommendations: asyncHandler(async (req: Request, res: Response) => {
    const { goal, difficulty } = req.query as { goal?: string; difficulty?: string }
    const recs = await EquipmentService.getRecommendations(req.user!.id, { goal, difficulty })
    res.json({ data: recs })
  }),
}
