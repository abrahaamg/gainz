import { Router, IRouter, Request, Response } from 'express'
import { checkDatabaseConnection } from './config'
import { authMiddleware } from './middlewares'
import exerciseRouter from './routes/exercise'
import routineRouter from './routes/routine'
import sessionRouter from './routes/session'
import equipmentRouter from './routes/equipment'
import progressRouter from './routes/progress'
import authRouter from './routes/auth'
import { EquipmentController } from './controllers/EquipmentController'

const router: IRouter = Router()

// ─── Health check ────────────────────────────────────────────
router.get('/health', async (_req: Request, res: Response) => {
  const dbConnected = await checkDatabaseConnection()
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected',
  })
})

// ─── API v1 ──────────────────────────────────────────────────
router.use('/api/v1/auth',        authMiddleware, authRouter)
router.use('/api/v1/exercises',   authMiddleware, exerciseRouter)
router.use('/api/v1/routines',    authMiddleware, routineRouter)
router.use('/api/v1/sessions',    authMiddleware, sessionRouter)
router.use('/api/v1/equipment',   authMiddleware, equipmentRouter)
router.get('/api/v1/recommendations', authMiddleware, EquipmentController.getRecommendations)
router.use('/api/v1/progress',    authMiddleware, progressRouter)

export default router
