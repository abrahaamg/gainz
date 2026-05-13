import api from './api'
import {
  ChartsData,
  ExerciseOption,
  PersonalRecord,
  ProgressionPoint,
  Badge,
  StreakStats,
} from '../types/progress'

export const progressService = {
  getCharts: async (days: number): Promise<ChartsData> => {
    const res = await api.get<{ data: ChartsData }>('/progress/charts', { params: { days } })
    return res.data.data
  },

  getTrainedExercises: async (): Promise<ExerciseOption[]> => {
    const res = await api.get<{ data: ExerciseOption[] }>('/progress/exercises')
    return res.data.data
  },

  getExerciseProgression: async (exerciseId: number): Promise<ProgressionPoint[]> => {
    const res = await api.get<{ data: ProgressionPoint[] }>(`/progress/progression/${exerciseId}`)
    return res.data.data
  },

  get1RMProgression: async (exerciseId: number): Promise<ProgressionPoint[]> => {
    const res = await api.get<{ data: ProgressionPoint[] }>(`/progress/1rm/${exerciseId}`)
    return res.data.data
  },

  getRecords: async (): Promise<PersonalRecord[]> => {
    const res = await api.get<{ data: PersonalRecord[] }>('/progress/records')
    return res.data.data
  },

  getStats: async (): Promise<{ streak: StreakStats; badges: Badge[] }> => {
    const res = await api.get<{ data: { streak: StreakStats; badges: Badge[] } }>('/progress/stats')
    return res.data.data
  },
}
