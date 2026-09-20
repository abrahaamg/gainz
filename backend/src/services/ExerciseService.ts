import ExerciseModel from '../models/ExerciseModel'
import { Exercise, CreateExerciseDTO, UpdateExerciseDTO, ExerciseFilters } from '../types/entities/Exercise'
import { PaginatedResult } from '../types'
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils'

/**
 * Solo el creador de un ejercicio puede modificarlo o borrarlo. Los ejercicios
 * del catálogo base llegan con created_by = NULL y no pertenecen a nadie, así
 * que nadie puede tocarlos por API.
 *
 * Antes update() y delete() solo comprobaban que el ejercicio existiera, de
 * modo que cualquier usuario autenticado podía editar o borrar los ejercicios
 * de los demás y el catálogo entero.
 */
const assertOwner = (exercise: Exercise, userId: number): void => {
  if (exercise.created_by === null || exercise.created_by !== userId) {
    throw new ForbiddenError('No puedes modificar un ejercicio que no has creado')
  }
}

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

  async update(id: number, data: UpdateExerciseDTO, userId: number): Promise<Exercise> {
    const exercise = await ExerciseService.getById(id)   // throws NotFoundError if missing
    assertOwner(exercise, userId)
    const updated = await ExerciseModel.update(id, data)
    return updated!
  },

  async delete(id: number, userId: number): Promise<void> {
    const exercise = await ExerciseService.getById(id)
    assertOwner(exercise, userId)
    const deleted = await ExerciseModel.delete(id)
    if (!deleted) throw new NotFoundError('Exercise')
  },
}

export default ExerciseService
