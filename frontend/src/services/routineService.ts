import api from './api'
import { Routine, CreateRoutinePayload } from '../types/routine'

export const routineService = {
  getAll: async (): Promise<Routine[]> => {
    const res = await api.get<{ data: Routine[] }>('/routines')
    return res.data.data
  },

  getById: async (id: number): Promise<Routine> => {
    const res = await api.get<{ data: Routine }>(`/routines/${id}`)
    return res.data.data
  },

  create: async (payload: CreateRoutinePayload): Promise<Routine> => {
    const res = await api.post<{ data: Routine }>('/routines', payload)
    return res.data.data
  },

  update: async (id: number, payload: Partial<CreateRoutinePayload>): Promise<Routine> => {
    const res = await api.put<{ data: Routine }>(`/routines/${id}`, payload)
    return res.data.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/routines/${id}`)
  },
}
