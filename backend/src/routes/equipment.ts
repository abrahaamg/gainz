import { Router, IRouter } from 'express'
import { EquipmentController } from '../controllers/EquipmentController'

const equipmentRouter: IRouter = Router()

equipmentRouter.get('/catalog',   EquipmentController.getCatalog)
equipmentRouter.get('/',          EquipmentController.getAll)
equipmentRouter.get('/exercises', EquipmentController.getAccessibleExercises)
equipmentRouter.post('/',         EquipmentController.create)
equipmentRouter.put('/:id',       EquipmentController.update)
equipmentRouter.delete('/:id',    EquipmentController.delete)

export default equipmentRouter
