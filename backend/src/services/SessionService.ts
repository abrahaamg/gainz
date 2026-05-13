import { SessionModel } from '../models/SessionModel'
import { AddSetDTO, FinishSessionDTO, Session, SessionExercise } from '../types/entities/Session'
import { BadRequestError, NotFoundError } from '../utils/customErrors'

export const SessionService = {
  create: async (userId: number, routineId: number): Promise<number> => {
    if (!routineId) throw new BadRequestError('routine_id es requerido')
    return SessionModel.create(userId, routineId)
  },

  getById: async (
    sessionId: number,
    userId: number
  ): Promise<{ session: Session; exercises: SessionExercise[] }> => {
    const result = await SessionModel.findById(sessionId, userId)
    if (!result) throw new NotFoundError('Sesión no encontrada')
    return result
  },

  getByUser: (userId: number, limit?: number): Promise<Session[]> =>
    SessionModel.findByUser(userId, limit),

  addSet: async (
    sessionId: number,
    userId: number,
    data: AddSetDTO
  ): Promise<{ new_pr: boolean }> => {
    if (!data.exercise_id) throw new BadRequestError('exercise_id es requerido')
    if (!data.set_number) throw new BadRequestError('set_number es requerido')
    return SessionModel.addSet(sessionId, userId, data)
  },

  getLastPerformance: async (userId: number, exerciseId: number) => {
    if (!exerciseId) throw new BadRequestError('exercise_id es requerido')
    const perf = await SessionModel.getLastPerformance(userId, exerciseId)

    // Plateau detection: check last 3 session volumes
    let plateau_detected = false
    const volumes = await SessionModel.getExerciseVolumes(userId, exerciseId)
    if (volumes.length >= 3) {
      // volumes[0] = most recent, volumes[2] = oldest
      const [v1, v2, v3] = volumes.map(v => v.volume)
      if (v1 <= v2 && v2 <= v3) {
        plateau_detected = true
      }
    }

    return perf ? { ...perf, plateau_detected } : { weight_kg: null, reps_done: null, rpe: null, plateau_detected }
  },

  finish: async (
    sessionId: number,
    userId: number,
    data: FinishSessionDTO
  ): Promise<{ session: Session; exercises: SessionExercise[] }> => {
    const existing = await SessionModel.findById(sessionId, userId)
    if (!existing) throw new NotFoundError('Sesión no encontrada')
    if (existing.session.status !== 'in_progress') {
      throw new BadRequestError('La sesión ya fue finalizada')
    }
    await SessionModel.finish(sessionId, userId, data)
    const updated = await SessionModel.findById(sessionId, userId)
    return updated!
  },
}
