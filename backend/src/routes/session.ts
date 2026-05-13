import { Router, IRouter } from 'express'
import { SessionController } from '../controllers/SessionController'

const sessionRouter: IRouter = Router()

sessionRouter.get('/',              SessionController.getByUser)
sessionRouter.get('/:id',           SessionController.getById)
sessionRouter.post('/',             SessionController.create)
sessionRouter.put('/:id',           SessionController.finish)
sessionRouter.get('/exercises/:exerciseId/last-performance', SessionController.getLastPerformance)
sessionRouter.post('/:id/exercises', SessionController.addSet)

export default sessionRouter
