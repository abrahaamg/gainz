import { Request, Response, NextFunction } from 'express'
import ExerciseService from '../services/ExerciseService'
import { HTTP_STATUS } from '../constants'

const ExerciseController = {
  // GET /api/v1/exercises
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
      const result = await ExerciseService.getAll(filters)
      res.status(HTTP_STATUS.OK).json(result)
    } catch (err) {
      next(err)
    }
  },

  // GET /api/v1/exercises/:id
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exercise = await ExerciseService.getById(parseInt(req.params.id, 10))
      res.status(HTTP_STATUS.OK).json(exercise)
    } catch (err) {
      next(err)
    }
  },

  // POST /api/v1/exercises
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id
      const exercise = await ExerciseService.create(req.body, userId)
      res.status(HTTP_STATUS.CREATED).json(exercise)
    } catch (err) {
      next(err)
    }
  },

  // PUT /api/v1/exercises/:id
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exercise = await ExerciseService.update(parseInt(req.params.id, 10), req.body)
      res.status(HTTP_STATUS.OK).json(exercise)
    } catch (err) {
      next(err)
    }
  },

  // DELETE /api/v1/exercises/:id
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ExerciseService.delete(parseInt(req.params.id, 10))
      res.status(HTTP_STATUS.OK).json({ deleted: true })
    } catch (err) {
      next(err)
    }
  },
}

export default ExerciseController
