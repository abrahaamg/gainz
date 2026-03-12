import api from './api'
import {
  Exercise,
  ExerciseFilters,
  CreateExerciseDTO,
  UpdateExerciseDTO,
  PaginatedExercises,
} from '../types/exercise'

export const exerciseService = {
  async getAll(filters: ExerciseFilters = {}): Promise<PaginatedExercises> {
    const { data } = await api.get<PaginatedExercises>('/exercises', { params: filters })
    return data
  },

  async getById(id: number): Promise<Exercise> {
    const { data } = await api.get<Exercise>(`/exercises/${id}`)
    return data
  },

  async create(dto: CreateExerciseDTO): Promise<Exercise> {
    const { data } = await api.post<Exercise>('/exercises', dto)
    return data
  },

  async update(id: number, dto: UpdateExerciseDTO): Promise<Exercise> {
    const { data } = await api.put<Exercise>(`/exercises/${id}`, dto)
    return data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/exercises/${id}`)
  },
}
