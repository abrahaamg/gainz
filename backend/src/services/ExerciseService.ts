import * as q from '../queries/exercise.queries'
import { Exercise, CreateExerciseDTO, UpdateExerciseDTO, ExerciseFilters } from '../types/entities/Exercise'
import { PaginatedResult } from '../types'
import { NotFoundError, BadRequestError, ForbiddenError, buildPaginatedResult, parsePaginationParams } from '../utils'

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
  async getAll(filters: ExerciseFilters, userId: number): Promise<PaginatedResult<Exercise>> {
    const pagination = parsePaginationParams(filters.page, filters.limit)
    const { rows, total } = await q.findAllExercises({ ...filters, ...pagination }, userId)
    return buildPaginatedResult(rows, total, pagination)
  },

  async getById(id: number, userId: number): Promise<Exercise> {
    const exercise = await q.findExerciseById(id, userId)
    if (!exercise) throw new NotFoundError('Ejercicio no encontrado')
    return exercise
  },

  async create(data: CreateExerciseDTO, userId: number): Promise<Exercise> {
    if (!data.name?.trim()) throw new BadRequestError('El nombre del ejercicio es obligatorio')
    if (!data.category)     throw new BadRequestError('La categoría es obligatoria')
    if (!data.muscle_group) throw new BadRequestError('El grupo muscular es obligatorio')
    const id = await q.createExercise(data, userId)
    const exercise = await q.findExerciseById(id, userId)
    return exercise!
  },

  async update(id: number, data: UpdateExerciseDTO, userId: number): Promise<Exercise> {
    const exercise = await ExerciseService.getById(id, userId)   // throws NotFoundError if missing
    assertOwner(exercise, userId)
    await q.updateExercise(id, data)
    const updated = await q.findExerciseById(id, userId)
    return updated!
  },

  async delete(id: number, userId: number): Promise<void> {
    const exercise = await ExerciseService.getById(id, userId)
    assertOwner(exercise, userId)
    const deleted = await q.deleteExercise(id)
    if (!deleted) throw new NotFoundError('Ejercicio no encontrado')
  },
}

export default ExerciseService
