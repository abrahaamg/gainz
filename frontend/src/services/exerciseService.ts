import api from './api'
import {
  Exercise,
  ExerciseFilters,
  CreateExerciseDTO,
  UpdateExerciseDTO,
  PaginatedExercises,
} from '../types/exercise'

// Contrato del backend: el detalle, la creación y la edición devuelven { data: Exercise };
// DELETE devuelve { data: { deleted: true } }; el listado, { data: Exercise[], pagination }.
export const exerciseService = {
  async getAll(filters: ExerciseFilters = {}): Promise<PaginatedExercises> {
    const { data } = await api.get<PaginatedExercises>('/exercises', { params: filters })
    return data
  },

  async getById(id: number): Promise<Exercise> {
    const res = await api.get<{ data: Exercise }>(`/exercises/${id}`)
    return res.data.data
  },

  async create(dto: CreateExerciseDTO): Promise<Exercise> {
    const res = await api.post<{ data: Exercise }>('/exercises', dto)
    return res.data.data
  },

  async update(id: number, dto: UpdateExerciseDTO): Promise<Exercise> {
    const res = await api.put<{ data: Exercise }>(`/exercises/${id}`, dto)
    return res.data.data
  },

  async delete(id: number): Promise<void> {
    await api.delete<{ data: { deleted: true } }>(`/exercises/${id}`)
  },
}
