import { Router, IRouter } from 'express'
import { RoutineController } from '../controllers/RoutineController'

const routineRouter: IRouter = Router()

routineRouter.get('/',     RoutineController.getAll)
routineRouter.get('/:id',  RoutineController.getById)
routineRouter.post('/',    RoutineController.create)
routineRouter.put('/:id',  RoutineController.update)
routineRouter.delete('/:id', RoutineController.delete)

export default routineRouter
