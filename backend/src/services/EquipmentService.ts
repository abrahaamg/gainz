import { EquipmentModel } from '../models/EquipmentModel'
import { CreateEquipmentDTO, Equipment, CatalogItem, Recommendation } from '../types/entities/Equipment'
import { BadRequestError, NotFoundError } from '../utils/customErrors'

export const EquipmentService = {
  getAll: (userId: number): Promise<Equipment[]> =>
    EquipmentModel.findByUser(userId),

  countAccessible: (userId: number): Promise<number> =>
    EquipmentModel.countAccess(userId),

  countBodyweight: (): Promise<number> =>
    EquipmentModel.countBodyweight(),

  findAccessible: (userId: number) =>
    EquipmentModel.findAccessible(userId),

  getCatalog: (): Promise<CatalogItem[]> =>
    EquipmentModel.getCatalog(),

  create: async (userId: number, data: CreateEquipmentDTO): Promise<Equipment> => {
    if (!data.name?.trim()) throw new BadRequestError('El nombre del equipo es obligatorio')
    return EquipmentModel.create(userId, data)
  },

  createWithExercises: async (
    userId: number,
    data: CreateEquipmentDTO,
    exerciseIds: number[]
  ): Promise<Equipment> => {
    if (!data.name?.trim()) throw new BadRequestError('El nombre del equipo es obligatorio')
    const item = await EquipmentModel.create(userId, data)
    if (exerciseIds.length > 0) {
      await EquipmentModel.linkCustom(item.name, exerciseIds)
    }
    return item
  },

  update: async (id: number, userId: number, data: Partial<CreateEquipmentDTO>): Promise<Equipment> => {
    const updated = await EquipmentModel.update(id, userId, data)
    if (!updated) throw new NotFoundError('Equipo no encontrado')
    return updated
  },

  delete: async (id: number, userId: number): Promise<void> => {
    const deleted = await EquipmentModel.delete(id, userId)
    if (!deleted) throw new NotFoundError('Equipo no encontrado')
  },

  getRecommendations: (
    userId: number,
    filters?: { goal?: string; difficulty?: string }
  ): Promise<Recommendation[]> =>
    EquipmentModel.recommend(userId, filters),
}
