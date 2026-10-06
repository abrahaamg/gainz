import api from './api'
import { Routine, CreateRoutinePayload } from '../types/routine'

export const routineService = {
  /** Por defecto sin las ocultas; con includeHidden salen todas marcadas con is_hidden. */
  getAll: async ({ includeHidden = false }: { includeHidden?: boolean } = {}): Promise<Routine[]> => {
    const res = await api.get<{ data: Routine[] }>('/routines', {
      params: includeHidden ? { include_hidden: true } : undefined,
    })
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

  /** Quita una rutina pública ajena de la lista del usuario (no la borra). */
  hide: async (id: number): Promise<void> => {
    await api.post(`/routines/${id}/hide`)
  },

  unhide: async (id: number): Promise<void> => {
    await api.delete(`/routines/${id}/hide`)
  },
}
