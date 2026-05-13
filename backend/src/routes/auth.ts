import { Router, IRouter } from 'express'
import { AuthController } from '../controllers/AuthController'

const router: IRouter = Router()

router.get('/',    AuthController.me)
router.patch('/me', AuthController.updateMe)

export default router
