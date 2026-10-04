import { Router, IRouter } from 'express'
import { AuthController } from '../controllers/AuthController'
import { validate } from '../middlewares/validate'
import { updateMeBody } from '../schemas/auth'

const router: IRouter = Router()

router.get('/',    AuthController.me)
router.patch('/me', validate({ body: updateMeBody }), AuthController.updateMe)

export default router
