import * as q from '../queries/session.queries'
import { AddSetDTO, FinishSessionDTO, Session, SessionExercise } from '../types/entities/Session'

export const SessionModel = {
  create: (userId: number, routineId: number): Promise<number> =>
    q.createSession(userId, routineId),

  findById: (
    sessionId: number,
    userId: number
  ): Promise<{ session: Session; exercises: SessionExercise[] } | null> =>
    q.findSessionById(sessionId, userId),

  findByUser: (userId: number, limit?: number): Promise<Session[]> =>
    q.findUserSessions(userId, limit),

  addSet: (
    sessionId: number,
    userId: number,
    data: AddSetDTO
  ): Promise<{ new_pr: boolean }> =>
    q.addSet(sessionId, userId, data),

  finish: (sessionId: number, userId: number, data: FinishSessionDTO): Promise<void> =>
    q.finishSession(sessionId, userId, data),
}
