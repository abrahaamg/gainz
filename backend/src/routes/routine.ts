import { Router, IRouter } from 'express'
import { RoutineController } from '../controllers/RoutineController'
import { validate } from '../middlewares/validate'
import { idParams } from '../schemas/common'
import { createRoutineBody, updateRoutineBody } from '../schemas/routine'

const routineRouter: IRouter = Router()

routineRouter.get('/',     RoutineController.getAll)
routineRouter.get('/:id',  validate({ params: idParams }), RoutineController.getById)
routineRouter.post('/',    validate({ body: createRoutineBody }), RoutineController.create)
routineRouter.put('/:id',  validate({ params: idParams, body: updateRoutineBody }), RoutineController.update)
routineRouter.delete('/:id', validate({ params: idParams }), RoutineController.delete)

export default routineRouter
