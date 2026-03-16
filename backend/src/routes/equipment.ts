import { Router } from 'express'
import { EquipmentController } from '../controllers/EquipmentController'

const equipmentRouter = Router()

equipmentRouter.get('/',     EquipmentController.getAll)
equipmentRouter.post('/',    EquipmentController.create)
equipmentRouter.put('/:id',  EquipmentController.update)
equipmentRouter.delete('/:id', EquipmentController.delete)

export default equipmentRouter
