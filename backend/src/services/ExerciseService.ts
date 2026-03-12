import ExerciseModel from '../models/ExerciseModel'
import { Exercise, CreateExerciseDTO, UpdateExerciseDTO, ExerciseFilters } from '../types/entities/Exercise'
import { PaginatedResult } from '../types'
import { NotFoundError, BadRequestError } from '../utils'

const ExerciseService = {
  async getAll(filters: ExerciseFilters): Promise<PaginatedResult<Exercise>> {
    return ExerciseModel.findAll(filters)
  },

  async getById(id: number): Promise<Exercise> {
    const exercise = await ExerciseModel.findById(id)
    if (!exercise) throw new NotFoundError('Exercise')
    return exercise
  },

  async create(data: CreateExerciseDTO, userId: number): Promise<Exercise> {
    if (!data.name?.trim()) throw new BadRequestError('El nombre del ejercicio es obligatorio')
    if (!data.category)     throw new BadRequestError('La categoría es obligatoria')
    if (!data.muscle_group) throw new BadRequestError('El grupo muscular es obligatorio')
    return ExerciseModel.create(data, userId)
  },

  async update(id: number, data: UpdateExerciseDTO): Promise<Exercise> {
    await ExerciseService.getById(id)   // throws NotFoundError if missing
    const updated = await ExerciseModel.update(id, data)
    return updated!
  },

  async delete(id: number): Promise<void> {
    await ExerciseService.getById(id)
    const deleted = await ExerciseModel.delete(id)
    if (!deleted) throw new NotFoundError('Exercise')
  },
}

export default ExerciseService
