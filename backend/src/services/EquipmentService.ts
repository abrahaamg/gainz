import * as q from '../queries/equipment.queries'
import { CreateEquipmentDTO, Equipment, CatalogItem, Recommendation } from '../types/entities/Equipment'
import { BadRequestError, NotFoundError } from '../utils/customErrors'

export const EquipmentService = {
  getAll: (userId: number): Promise<Equipment[]> =>
    q.findUserEquipment(userId),

  countAccessible: (userId: number): Promise<number> =>
    q.countAccessibleExercises(userId),

  countBodyweight: (): Promise<number> =>
    q.countBodyweightExercises(),

  findAccessible: (userId: number) =>
    q.findAccessibleExercises(userId),

  getCatalog: (): Promise<CatalogItem[]> =>
    q.getCatalog(),

  create: async (userId: number, data: CreateEquipmentDTO): Promise<Equipment> => {
    if (!data.name?.trim()) throw new BadRequestError('El nombre del equipo es obligatorio')
    return q.createEquipment(userId, data)
  },

  createWithExercises: async (
    userId: number,
    data: CreateEquipmentDTO,
    exerciseIds: number[]
  ): Promise<Equipment> => {
    if (!data.name?.trim()) throw new BadRequestError('El nombre del equipo es obligatorio')
    const item = await q.createEquipment(userId, data)
    if (exerciseIds.length > 0) {
      await q.linkEquipmentToExercises(userId, item.name, exerciseIds)
    }
    return item
  },

  update: async (id: number, userId: number, data: Partial<CreateEquipmentDTO>): Promise<Equipment> => {
    const updated = await q.updateEquipment(id, userId, data)
    if (!updated) throw new NotFoundError('Equipo no encontrado')
    return updated
  },

  delete: async (id: number, userId: number): Promise<void> => {
    const deleted = await q.deleteEquipment(id, userId)
    if (!deleted) throw new NotFoundError('Equipo no encontrado')
  },

  getRecommendations: (
    userId: number,
    filters?: { goal?: string; difficulty?: string }
  ): Promise<Recommendation[]> =>
    q.findRecommendations(userId, filters),
}
