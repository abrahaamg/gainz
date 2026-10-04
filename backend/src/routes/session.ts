import { Router, IRouter } from 'express'
import { SessionController } from '../controllers/SessionController'
import { validate } from '../middlewares/validate'
import { exerciseIdParams, idParams } from '../schemas/common'
import { addSetBody, createSessionBody, finishSessionBody, listSessionsQuery } from '../schemas/session'

const sessionRouter: IRouter = Router()

sessionRouter.get('/',              validate({ query: listSessionsQuery }), SessionController.getByUser)
sessionRouter.get('/:id',           validate({ params: idParams }), SessionController.getById)
sessionRouter.post('/',             validate({ body: createSessionBody }), SessionController.create)
sessionRouter.put('/:id',           validate({ params: idParams, body: finishSessionBody }), SessionController.finish)
sessionRouter.get('/exercises/:exerciseId/last-performance', validate({ params: exerciseIdParams }), SessionController.getLastPerformance)
sessionRouter.post('/:id/exercises', validate({ params: idParams, body: addSetBody }), SessionController.addSet)

export default sessionRouter
