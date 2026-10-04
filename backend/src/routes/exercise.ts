import { Router, IRouter } from 'express'
import ExerciseController from '../controllers/ExerciseController'
import { validate } from '../middlewares/validate'
import { idParams } from '../schemas/common'
import { createExerciseBody, listExercisesQuery, updateExerciseBody } from '../schemas/exercise'

const router: IRouter = Router()

router.get('/',       validate({ query: listExercisesQuery }), ExerciseController.getAll)
router.get('/:id',    validate({ params: idParams }), ExerciseController.getById)
router.post('/',      validate({ body: createExerciseBody }), ExerciseController.create)
router.put('/:id',    validate({ params: idParams, body: updateExerciseBody }), ExerciseController.update)
router.delete('/:id', validate({ params: idParams }), ExerciseController.delete)

export default router
