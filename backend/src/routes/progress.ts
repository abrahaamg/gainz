import { Router, IRouter } from 'express'
import { ProgressController } from '../controllers/ProgressController'

const router: IRouter = Router()

router.get('/charts',                    ProgressController.getCharts)
router.get('/exercises',                 ProgressController.getTrainedExercises)
router.get('/progression/:exerciseId',   ProgressController.getExerciseProgression)
router.get('/1rm/:exerciseId',           ProgressController.get1RMProgression)
router.get('/records',                   ProgressController.getRecords)
router.get('/stats',                     ProgressController.getStats)

export default router
