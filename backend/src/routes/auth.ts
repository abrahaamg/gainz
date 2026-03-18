import { Router } from 'express'
import { AuthController } from '../controllers/AuthController'

const router = Router()

router.get('/',    AuthController.me)
router.patch('/me', AuthController.updateMe)

export default router
