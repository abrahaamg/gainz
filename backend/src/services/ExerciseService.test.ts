import { describe, it, expect, vi, beforeEach } from 'vitest'
import ExerciseService from './ExerciseService'
import ExerciseModel from '../models/ExerciseModel'

vi.mock('../models/ExerciseModel', () => ({
  default: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockExercise = {
  id: 1,
  name: 'Press de Banca',
  category: 'strength' as const,
  muscle_group: 'chest',
  secondary_muscles: ['triceps', 'shoulders'],
  description: 'Ejercicio compuesto para pecho',
  instructions: '1. Tumbarse en banco\n2. Agarrar barra',
  difficulty: 'medium' as const,
  video_url: null,
  image_url: null,
  requires_equipment: true,
  is_unilateral: false,
  notes: null,
  created_by: 1,
  is_public: true,
  created_at: '2024-01-01',
  equipment: ['Barra olímpica', 'Banco plano'],
}

describe('ExerciseService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('devuelve ejercicios paginados', async () => {
      const mockResult = {
        data: [mockExercise],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
      }
      vi.mocked(ExerciseModel.findAll).mockResolvedValue(mockResult)

      const result = await ExerciseService.getAll({ page: 1, limit: 20 })
      expect(result).toEqual(mockResult)
      expect(ExerciseModel.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 })
    })

    it('aplica filtros de categoría y músculo', async () => {
      const filters = { category: 'strength', muscle: 'chest' }
      vi.mocked(ExerciseModel.findAll).mockResolvedValue({ data: [], pagination: {} as any })

      await ExerciseService.getAll(filters)
      expect(ExerciseModel.findAll).toHaveBeenCalledWith(filters)
    })
  })

  describe('getById', () => {
    it('devuelve el ejercicio si existe', async () => {
      vi.mocked(ExerciseModel.findById).mockResolvedValue(mockExercise)

      const result = await ExerciseService.getById(1)
      expect(result).toEqual(mockExercise)
      expect(ExerciseModel.findById).toHaveBeenCalledWith(1)
    })

    it('lanza NotFoundError si no existe', async () => {
      vi.mocked(ExerciseModel.findById).mockResolvedValue(null)

      await expect(ExerciseService.getById(999)).rejects.toThrow('not found')
    })
  })

  describe('create', () => {
    it('crea un ejercicio con datos válidos', async () => {
      const dto = { name: 'Nuevo ejercicio', category: 'strength' as const, muscle_group: 'chest' }
      vi.mocked(ExerciseModel.create).mockResolvedValue(mockExercise)

      const result = await ExerciseService.create(dto, 1)
      expect(result).toEqual(mockExercise)
      expect(ExerciseModel.create).toHaveBeenCalledWith(dto, 1)
    })

    it('lanza BadRequestError si falta el nombre', async () => {
      const dto = { name: '', category: 'strength' as const, muscle_group: 'chest' }
      await expect(ExerciseService.create(dto, 1)).rejects.toThrow('nombre')
    })

    it('lanza BadRequestError si falta la categoría', async () => {
      const dto = { name: 'Test', category: '' as any, muscle_group: 'chest' }
      await expect(ExerciseService.create(dto, 1)).rejects.toThrow('categoría')
    })

    it('lanza BadRequestError si falta el grupo muscular', async () => {
      const dto = { name: 'Test', category: 'strength' as const, muscle_group: '' }
      await expect(ExerciseService.create(dto, 1)).rejects.toThrow('grupo muscular')
    })
  })

  describe('update', () => {
    it('actualiza un ejercicio existente', async () => {
      vi.mocked(ExerciseModel.findById).mockResolvedValue(mockExercise)
      const updated = { ...mockExercise, name: 'Press Actualizado' }
      vi.mocked(ExerciseModel.update).mockResolvedValue(updated)

      const result = await ExerciseService.update(1, { name: 'Press Actualizado' })
      expect(result.name).toBe('Press Actualizado')
    })

    it('lanza NotFoundError si el ejercicio no existe', async () => {
      vi.mocked(ExerciseModel.findById).mockResolvedValue(null)

      await expect(ExerciseService.update(999, { name: 'Test' })).rejects.toThrow('not found')
    })
  })

  describe('delete', () => {
    it('elimina un ejercicio existente', async () => {
      vi.mocked(ExerciseModel.findById).mockResolvedValue(mockExercise)
      vi.mocked(ExerciseModel.delete).mockResolvedValue(true)

      await expect(ExerciseService.delete(1)).resolves.toBeUndefined()
    })

    it('lanza NotFoundError si el ejercicio no existe', async () => {
      vi.mocked(ExerciseModel.findById).mockResolvedValue(null)

      await expect(ExerciseService.delete(999)).rejects.toThrow('not found')
    })

    it('lanza NotFoundError si delete devuelve false', async () => {
      vi.mocked(ExerciseModel.findById).mockResolvedValue(mockExercise)
      vi.mocked(ExerciseModel.delete).mockResolvedValue(false)

      await expect(ExerciseService.delete(1)).rejects.toThrow('not found')
    })
  })
})
