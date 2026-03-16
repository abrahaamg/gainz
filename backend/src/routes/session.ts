import { Router } from 'express'
import { SessionController } from '../controllers/SessionController'

const sessionRouter = Router()

sessionRouter.get('/',              SessionController.getByUser)
sessionRouter.get('/:id',           SessionController.getById)
sessionRouter.post('/',             SessionController.create)
sessionRouter.put('/:id',           SessionController.finish)
sessionRouter.post('/:id/exercises', SessionController.addSet)

export default sessionRouter
