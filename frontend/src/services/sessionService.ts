import api from './api'
import { AddSetPayload, FinishSessionPayload, Session } from '../types/session'

export const sessionService = {
  create: async (routineId: number): Promise<{ id: number }> => {
    const res = await api.post<{ data: { id: number } }>('/sessions', { routine_id: routineId })
    return res.data.data
  },

  getById: async (sessionId: number): Promise<Session> => {
    const res = await api.get<{ data: Session }>(`/sessions/${sessionId}`)
    return res.data.data
  },

  getByUser: async (limit = 20): Promise<Session[]> => {
    const res = await api.get<{ data: Session[] }>('/sessions', { params: { limit } })
    return res.data.data
  },

  getLastPerformance: async (
    exerciseId: number
  ): Promise<{ weight_kg: number | null; reps_done: number | null; rpe: number | null; plateau_detected: boolean }> => {
    const res = await api.get<{ data: { weight_kg: number | null; reps_done: number | null; rpe: number | null; plateau_detected: boolean } }>(
      `/sessions/exercises/${exerciseId}/last-performance`
    )
    return res.data.data
  },

  addSet: async (
    sessionId: number,
    payload: AddSetPayload
  ): Promise<{ new_pr: boolean }> => {
    const res = await api.post<{ data: { new_pr: boolean } }>(
      `/sessions/${sessionId}/exercises`,
      payload
    )
    return res.data.data
  },

  finish: async (sessionId: number, payload: FinishSessionPayload): Promise<Session> => {
    const res = await api.put<{ data: Session }>(`/sessions/${sessionId}`, payload)
    return res.data.data
  },
}
