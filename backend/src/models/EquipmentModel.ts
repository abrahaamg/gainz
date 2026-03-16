import * as q from '../queries/equipment.queries'
import { CreateEquipmentDTO, Equipment, Recommendation } from '../types/entities/Equipment'

export const EquipmentModel = {
  findByUser:   (userId: number): Promise<Equipment[]> => q.findUserEquipment(userId),
  create:       (userId: number, data: CreateEquipmentDTO): Promise<Equipment> => q.createEquipment(userId, data),
  update:       (id: number, userId: number, data: Partial<CreateEquipmentDTO>): Promise<Equipment | null> => q.updateEquipment(id, userId, data),
  delete:       (id: number, userId: number): Promise<boolean> => q.deleteEquipment(id, userId),
  countAccess:  (userId: number): Promise<number> => q.countAccessibleExercises(userId),
  recommend:    (userId: number, filters?: { goal?: string; difficulty?: string }): Promise<Recommendation[]> => q.findRecommendations(userId, filters),
}
