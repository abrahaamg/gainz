import {
  findAllExercises,
  findExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
} from '../queries/exercise.queries'
import { Exercise, CreateExerciseDTO, UpdateExerciseDTO, ExerciseFilters } from '../types/entities/Exercise'
import { PaginatedResult } from '../types'
import { buildPaginatedResult, parsePaginationParams } from '../utils'

const ExerciseModel = {
  async findAll(filters: ExerciseFilters, userId: number): Promise<PaginatedResult<Exercise>> {
    const pagination = parsePaginationParams(filters.page, filters.limit)
    const { rows, total } = await findAllExercises({ ...filters, ...pagination }, userId)
    return buildPaginatedResult(rows, total, pagination)
  },

  async findById(id: number, userId: number): Promise<Exercise | null> {
    return findExerciseById(id, userId)
  },

  async create(data: CreateExerciseDTO, userId: number): Promise<Exercise> {
    const id = await createExercise(data, userId)
    const exercise = await findExerciseById(id, userId)
    return exercise!
  },

  async update(id: number, data: UpdateExerciseDTO, userId: number): Promise<Exercise | null> {
    await updateExercise(id, data)
    return findExerciseById(id, userId)
  },

  async delete(id: number): Promise<boolean> {
    return deleteExercise(id)
  },
}

export default ExerciseModel
