import { RoutineModel } from '../models/RoutineModel'
import { CreateRoutineDTO, Routine, RoutineExercise } from '../types/entities/Routine'
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/customErrors'

export const RoutineService = {
  getAll: (userId: number): Promise<Routine[]> =>
    RoutineModel.findAll(userId),

  getById: async (id: number, userId: number): Promise<{ routine: Routine; exercises: RoutineExercise[] }> => {
    const result = await RoutineModel.findById(id, userId)
    if (!result) throw new NotFoundError('Rutina no encontrada')
    return result
  },

  create: async (userId: number, data: CreateRoutineDTO): Promise<{ routine: Routine; exercises: RoutineExercise[] }> => {
    if (!data.name?.trim()) throw new BadRequestError('El nombre de la rutina es obligatorio')
    if (!data.exercises) data.exercises = []
    const id = await RoutineModel.create(userId, data)
    const result = await RoutineModel.findById(id, userId)
    return result!
  },

  update: async (id: number, userId: number, data: Partial<CreateRoutineDTO>): Promise<{ routine: Routine; exercises: RoutineExercise[] }> => {
    const existing = await RoutineModel.findById(id, userId)
    if (!existing) throw new NotFoundError('Rutina no encontrada')
    // findById también devuelve rutinas públicas ajenas: solo el dueño puede editar
    if (existing.routine.user_id !== userId) {
      throw new ForbiddenError('No puedes modificar una rutina que no es tuya')
    }
    await RoutineModel.update(id, userId, data)
    const updated = await RoutineModel.findById(id, userId)
    return updated!
  },

  delete: async (id: number, userId: number): Promise<void> => {
    const deleted = await RoutineModel.delete(id, userId)
    if (!deleted) throw new NotFoundError('Rutina no encontrada')
  },
}
