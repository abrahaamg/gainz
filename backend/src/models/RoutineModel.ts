import * as q from '../queries/routine.queries'
import { CreateRoutineDTO, Routine, RoutineExercise } from '../types/entities/Routine'

export const RoutineModel = {
  findAll: (userId: number): Promise<Routine[]> =>
    q.findAllRoutines(userId),

  findById: (id: number, userId: number): Promise<{ routine: Routine; exercises: RoutineExercise[] } | null> =>
    q.findRoutineById(id, userId),

  create: (userId: number, data: CreateRoutineDTO): Promise<number> =>
    q.createRoutine(userId, data),

  update: (id: number, userId: number, data: Partial<CreateRoutineDTO>): Promise<void> =>
    q.updateRoutine(id, userId, data),

  delete: (id: number, userId: number): Promise<boolean> =>
    q.deleteRoutine(id, userId),
}
