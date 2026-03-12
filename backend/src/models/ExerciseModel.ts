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
  async findAll(filters: ExerciseFilters): Promise<PaginatedResult<Exercise>> {
    const pagination = parsePaginationParams(filters.page, filters.limit)
    const { rows, total } = await findAllExercises({ ...filters, ...pagination })
    return buildPaginatedResult(rows, total, pagination)
  },

  async findById(id: number): Promise<Exercise | null> {
    return findExerciseById(id)
  },

  async create(data: CreateExerciseDTO, userId: number): Promise<Exercise> {
    const id = await createExercise(data, userId)
    const exercise = await findExerciseById(id)
    return exercise!
  },

  async update(id: number, data: UpdateExerciseDTO): Promise<Exercise | null> {
    await updateExercise(id, data)
    return findExerciseById(id)
  },

  async delete(id: number): Promise<boolean> {
    return deleteExercise(id)
  },
}

export default ExerciseModel
