import api from './api'
import { CatalogItem, CreateEquipmentPayload, Equipment, Recommendation } from '../types/equipment'

export const equipmentService = {
  getAll: async (): Promise<{ items: Equipment[]; accessible_exercises: number; bodyweight_exercises: number }> => {
    const res = await api.get<{ data: Equipment[]; accessible_exercises: number; bodyweight_exercises: number }>('/equipment')
    return { items: res.data.data, accessible_exercises: res.data.accessible_exercises, bodyweight_exercises: res.data.bodyweight_exercises }
  },

  getCatalog: async (): Promise<CatalogItem[]> => {
    const res = await api.get<{ data: CatalogItem[] }>('/equipment/catalog')
    return res.data.data
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

  getAccessibleExercises: async (): Promise<{ id: number; name: string; muscle_group: string }[]> => {
    const res = await api.get<{ data: { id: number; name: string; muscle_group: string }[] }>('/equipment/exercises')
    return res.data.data
  },

  getRecommendations: async (filters?: {
    goal?: string
    difficulty?: string
  }): Promise<Recommendation[]> => {
    const res = await api.get<{ data: Recommendation[] }>('/recommendations', { params: filters })
    return res.data.data
  },
}
