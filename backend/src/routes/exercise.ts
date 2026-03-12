import { Router, IRouter } from 'express'
import ExerciseController from '../controllers/ExerciseController'

const router: IRouter = Router()

router.get('/',       ExerciseController.getAll)
router.get('/:id',    ExerciseController.getById)
router.post('/',      ExerciseController.create)
router.put('/:id',    ExerciseController.update)
router.delete('/:id', ExerciseController.delete)

export default router
