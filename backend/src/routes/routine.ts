import { Router, IRouter } from 'express'
import { RoutineController } from '../controllers/RoutineController'
import { validate } from '../middlewares/validate'
import { idParams } from '../schemas/common'
import { createRoutineBody, listRoutinesQuery, routineOrderBody, updateRoutineBody } from '../schemas/routine'

const routineRouter: IRouter = Router()

routineRouter.get('/',     validate({ query: listRoutinesQuery }), RoutineController.getAll)
// Antes de /:id para que "order" no se tome como id
routineRouter.put('/order', validate({ body: routineOrderBody }), RoutineController.reorder)
routineRouter.get('/:id',  validate({ params: idParams }), RoutineController.getById)
routineRouter.post('/',    validate({ body: createRoutineBody }), RoutineController.create)
routineRouter.put('/:id',  validate({ params: idParams, body: updateRoutineBody }), RoutineController.update)
routineRouter.delete('/:id', validate({ params: idParams }), RoutineController.delete)
routineRouter.post('/:id/hide',   validate({ params: idParams }), RoutineController.hide)
routineRouter.delete('/:id/hide', validate({ params: idParams }), RoutineController.unhide)

export default routineRouter
