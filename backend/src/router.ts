import { Router, IRouter, Request, Response } from 'express'
import { checkDatabaseConnection } from './config'
import { authMiddleware } from './middlewares'
import exerciseRouter from './routes/exercise'

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
router.use('/api/v1/exercises', authMiddleware, exerciseRouter)
// Módulo 2: router.use('/api/v1/routines', authMiddleware, routineRouter)
// Módulo 3: router.use('/api/v1/sessions', authMiddleware, sessionRouter)

export default router
