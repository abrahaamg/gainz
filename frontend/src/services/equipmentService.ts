import api from './api'
import { CreateEquipmentPayload, Equipment, Recommendation } from '../types/equipment'

export const equipmentService = {
  getAll: async (): Promise<{ items: Equipment[]; accessible_exercises: number }> => {
    const res = await api.get<{ data: Equipment[]; accessible_exercises: number }>('/equipment')
    return { items: res.data.data, accessible_exercises: res.data.accessible_exercises }
  },

  create: async (payload: CreateEquipmentPayload): Promise<Equipment> => {
    const res = await api.post<{ data: Equipment }>('/equipment', payload)
    return res.data.data
  },

  update: async (id: number, payload: Partial<CreateEquipmentPayload>): Promise<Equipment> => {
    const res = await api.put<{ data: Equipment }>(`/equipment/${id}`, payload)
    return res.data.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/equipment/${id}`)
  },

  getRecommendations: async (filters?: {
    goal?: string
    difficulty?: string
  }): Promise<Recommendation[]> => {
    const res = await api.get<{ data: Recommendation[] }>('/recommendations', { params: filters })
    return res.data.data
  },
}
