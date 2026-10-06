import * as q from '../queries/equipment.queries'
import { CreateEquipmentDTO, Equipment, CatalogItem, Recommendation } from '../types/entities/Equipment'
import { BadRequestError, ConflictError, NotFoundError } from '../utils/customErrors'

const DUPLICATE_MESSAGE = 'Ya tienes este equipo'

/**
 * Crea el equipo si el usuario no tiene ya uno con el mismo nombre o el mismo
 * item del catálogo. El ER_DUP_ENTRY cubre dos altas simultáneas del mismo
 * nombre, que pasarían las dos la comprobación previa.
 */
const createUnique = async (userId: number, data: CreateEquipmentDTO): Promise<Equipment> => {
  if (await q.userHasEquipment(userId, data.name, data.catalog_name ?? null)) {
    throw new ConflictError(DUPLICATE_MESSAGE)
  }
  try {
    return await q.createEquipment(userId, data)
  } catch (err) {
    if ((err as { code?: string }).code === 'ER_DUP_ENTRY') throw new ConflictError(DUPLICATE_MESSAGE)
    throw err
  }
}

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
    return createUnique(userId, data)
  },

  createWithExercises: async (
    userId: number,
    data: CreateEquipmentDTO,
    exerciseIds: number[]
  ): Promise<Equipment> => {
    if (!data.name?.trim()) throw new BadRequestError('El nombre del equipo es obligatorio')
    const item = await createUnique(userId, data)
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
