import { Router, IRouter } from 'express'
import { ProgressController } from '../controllers/ProgressController'
import { validate } from '../middlewares/validate'
import { exerciseIdParams } from '../schemas/common'

const router: IRouter = Router()

router.get('/charts',                    ProgressController.getCharts)
router.get('/exercises',                 ProgressController.getTrainedExercises)
router.get('/progression/:exerciseId',   validate({ params: exerciseIdParams }), ProgressController.getExerciseProgression)
router.get('/1rm/:exerciseId',           validate({ params: exerciseIdParams }), ProgressController.get1RMProgression)
router.get('/records',                   ProgressController.getRecords)
router.get('/stats',                     ProgressController.getStats)

export default router
