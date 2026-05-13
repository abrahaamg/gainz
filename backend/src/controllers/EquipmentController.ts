import { Request, Response, NextFunction } from 'express'
import { EquipmentService } from '../services/EquipmentService'
import { HTTP_STATUS } from '../constants/http'

export const EquipmentController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [items, accessibleCount, bodyweightCount] = await Promise.all([
        EquipmentService.getAll(req.user!.id),
        EquipmentService.countAccessible(req.user!.id),
        EquipmentService.countBodyweight(),
      ])
      res.json({ data: items, accessible_exercises: accessibleCount, bodyweight_exercises: bodyweightCount })
    } catch (err) { next(err) }
  },

  getCatalog: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const catalog = await EquipmentService.getCatalog()
      res.json({ data: catalog })
    } catch (err) { next(err) }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { exercise_ids, ...data } = req.body
      let item
      if (exercise_ids?.length) {
        item = await EquipmentService.createWithExercises(req.user!.id, data, exercise_ids)
      } else {
        item = await EquipmentService.create(req.user!.id, data)
      }
      res.status(HTTP_STATUS.CREATED).json({ data: item })
    } catch (err) { next(err) }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await EquipmentService.update(Number(req.params.id), req.user!.id, req.body)
      res.json({ data: item })
    } catch (err) { next(err) }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await EquipmentService.delete(Number(req.params.id), req.user!.id)
      res.json({ data: { deleted: true } })
    } catch (err) { next(err) }
  },

  getAccessibleExercises: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const exercises = await EquipmentService.findAccessible(req.user!.id)
      res.json({ data: exercises })
    } catch (err) { next(err) }
  },

  getRecommendations: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { goal, difficulty } = req.query as { goal?: string; difficulty?: string }
      const recs = await EquipmentService.getRecommendations(req.user!.id, { goal, difficulty })
      res.json({ data: recs })
    } catch (err) { next(err) }
  },
}
