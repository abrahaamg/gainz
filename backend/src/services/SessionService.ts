import * as q from '../queries/session.queries'
import { AddSetDTO, FinishSessionDTO, LastPerformance, Session, SessionExercise } from '../types/entities/Session'
import { BadRequestError, NotFoundError } from '../utils/customErrors'

export const SessionService = {
  create: async (userId: number, routineId: number): Promise<number> => {
    if (!routineId) throw new BadRequestError('routine_id es requerido')
    const sessionId = await q.createSession(userId, routineId)
    if (sessionId === null) throw new NotFoundError('Rutina no encontrada')
    return sessionId
  },

  getById: async (
    sessionId: number,
    userId: number
  ): Promise<{ session: Session; exercises: SessionExercise[] }> => {
    const result = await q.findSessionById(sessionId, userId)
    if (!result) throw new NotFoundError('Sesión no encontrada')
    return result
  },

  getByUser: (userId: number, limit?: number): Promise<Session[]> =>
    q.findUserSessions(userId, limit),

  addSet: async (
    sessionId: number,
    userId: number,
    data: AddSetDTO
  ): Promise<{ new_pr: boolean }> => {
    if (!data.exercise_id) throw new BadRequestError('exercise_id es requerido')
    if (!data.set_number) throw new BadRequestError('set_number es requerido')
    const result = await q.addSet(sessionId, userId, data)
    if (!result) throw new NotFoundError('Sesión no encontrada o ya finalizada')
    return result
  },

  getLastPerformance: async (userId: number, exerciseId: number): Promise<LastPerformance> => {
    if (!exerciseId) throw new BadRequestError('exercise_id es requerido')
    const perf = await q.getLastPerformance(userId, exerciseId)
    const last_sets = await q.getLastSessionSets(userId, exerciseId)

    // Plateau detection: check last 3 session volumes
    let plateau_detected = false
    const volumes = await q.getExerciseVolumes(userId, exerciseId)
    if (volumes.length >= 3) {
      // volumes[0] = most recent, volumes[2] = oldest
      // mysql2 devuelve los DECIMAL como string: sin Number() se comparaban como texto
      const [v1, v2, v3] = volumes.map(v => Number(v.volume))
      if (v1 <= v2 && v2 <= v3) {
        plateau_detected = true
      }
    }

    return perf
      ? { ...perf, plateau_detected, last_sets }
      : { weight_kg: null, reps_done: null, rpe: null, plateau_detected, last_sets }
  },

  finish: async (
    sessionId: number,
    userId: number,
    data: FinishSessionDTO
  ): Promise<{ session: Session; exercises: SessionExercise[] }> => {
    const existing = await q.findSessionById(sessionId, userId)
    if (!existing) throw new NotFoundError('Sesión no encontrada')
    if (existing.session.status !== 'in_progress') {
      throw new BadRequestError('La sesión ya fue finalizada')
    }
    const finished = await q.finishSession(sessionId, userId, data)
    if (!finished) throw new BadRequestError('La sesión ya fue finalizada')
    const updated = await q.findSessionById(sessionId, userId)
    return updated!
  },
}
