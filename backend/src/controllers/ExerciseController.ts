import { Request, Response } from 'express'
import ExerciseService from '../services/ExerciseService'
import { HTTP_STATUS } from '../constants'
import { asyncHandler } from '../utils/functions'

const ExerciseController = {
  // GET /api/v1/exercises
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      category: req.query.category as string | undefined,
      muscle:   req.query.muscle   as string | undefined,
      difficulty: req.query.difficulty as string | undefined,
      requires_equipment: req.query.requires_equipment !== undefined
        ? req.query.requires_equipment === 'true'
        : undefined,
      q:     req.query.q     as string | undefined,
      page:  req.query.page  ? parseInt(req.query.page as string, 10)  : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    }
    const result = await ExerciseService.getAll(filters, req.user!.id)
    res.status(HTTP_STATUS.OK).json(result)
  }),

  // GET /api/v1/exercises/:id
  getById: asyncHandler(async (req: Request, res: Response) => {
    const exercise = await ExerciseService.getById(parseInt(req.params.id, 10), req.user!.id)
    res.status(HTTP_STATUS.OK).json({ data: exercise })
  }),

  // POST /api/v1/exercises
  create: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id
    const exercise = await ExerciseService.create(req.body, userId)
    res.status(HTTP_STATUS.CREATED).json({ data: exercise })
  }),

  // PUT /api/v1/exercises/:id
  update: asyncHandler(async (req: Request, res: Response) => {
    const exercise = await ExerciseService.update(parseInt(req.params.id, 10), req.body, req.user!.id)
    res.status(HTTP_STATUS.OK).json({ data: exercise })
  }),

  // DELETE /api/v1/exercises/:id
  delete: asyncHandler(async (req: Request, res: Response) => {
    await ExerciseService.delete(parseInt(req.params.id, 10), req.user!.id)
    res.status(HTTP_STATUS.OK).json({ data: { deleted: true } })
  }),
}

export default ExerciseController
