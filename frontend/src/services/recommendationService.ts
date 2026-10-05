import api from './api'
import type { GeneratedRoutine } from '../types/recommendation'

export const recommendationService = {
  async generate(): Promise<GeneratedRoutine[]> {
    const res = await api.get<{ data: GeneratedRoutine[] }>('/recommendations/generate')
    return res.data.data
  },

  async accept(routine: GeneratedRoutine): Promise<{ id: number }> {
    const res = await api.post<{ data: { id: number } }>('/recommendations/accept', routine)
    return res.data.data
  },

  async acceptAll(routines: GeneratedRoutine[]): Promise<void> {
    await api.post('/recommendations/accept-all', { routines })
  },
}
