import { Router, IRouter } from 'express'
import { EquipmentController } from '../controllers/EquipmentController'
import { validate } from '../middlewares/validate'
import { idParams } from '../schemas/common'
import { createEquipmentBody } from '../schemas/equipment'

const equipmentRouter: IRouter = Router()

equipmentRouter.get('/catalog',   EquipmentController.getCatalog)
equipmentRouter.get('/',          EquipmentController.getAll)
equipmentRouter.get('/exercises', EquipmentController.getAccessibleExercises)
equipmentRouter.post('/',         validate({ body: createEquipmentBody }), EquipmentController.create)
equipmentRouter.put('/:id',       validate({ params: idParams }), EquipmentController.update)
equipmentRouter.delete('/:id',    validate({ params: idParams }), EquipmentController.delete)

export default equipmentRouter
