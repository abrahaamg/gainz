import * as q from '../queries/routine.queries'
import { CreateRoutineDTO, Routine, RoutineExercise } from '../types/entities/Routine'
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/customErrors'

export const RoutineService = {
  getAll: (userId: number): Promise<Routine[]> =>
    q.findAllRoutines(userId),

  getById: async (id: number, userId: number): Promise<{ routine: Routine; exercises: RoutineExercise[] }> => {
    const result = await q.findRoutineById(id, userId)
    if (!result) throw new NotFoundError('Rutina no encontrada')
    return result
  },

  create: async (userId: number, data: CreateRoutineDTO): Promise<{ routine: Routine; exercises: RoutineExercise[] }> => {
    if (!data.name?.trim()) throw new BadRequestError('El nombre de la rutina es obligatorio')
    if (!data.exercises) data.exercises = []
    const id = await q.createRoutine(userId, data)
    const result = await q.findRoutineById(id, userId)
    return result!
  },

  update: async (id: number, userId: number, data: Partial<CreateRoutineDTO>): Promise<{ routine: Routine; exercises: RoutineExercise[] }> => {
    const existing = await q.findRoutineById(id, userId)
    if (!existing) throw new NotFoundError('Rutina no encontrada')
    // findById también devuelve rutinas públicas ajenas: solo el dueño puede editar
    if (existing.routine.user_id !== userId) {
      throw new ForbiddenError('No puedes modificar una rutina que no es tuya')
    }
    await q.updateRoutine(id, userId, data)
    const updated = await q.findRoutineById(id, userId)
    return updated!
  },

  delete: async (id: number, userId: number): Promise<void> => {
    const deleted = await q.deleteRoutine(id, userId)
    if (!deleted) throw new NotFoundError('Rutina no encontrada')
  },
}
