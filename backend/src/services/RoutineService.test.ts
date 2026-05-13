import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RoutineService } from './RoutineService'
import { RoutineModel } from '../models/RoutineModel'

vi.mock('../models/RoutineModel', () => ({
  RoutineModel: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockRoutine = {
  id: 1,
  user_id: 1,
  name: 'Fuerza Básica con Barra',
  description: 'Los 5 levantamientos fundamentales',
  goal: 'strength',
  difficulty: 'medium',
  estimated_duration_min: 60,
  warmup_notes: 'Calentar 5 min',
  cooldown_notes: 'Estirar 5 min',
  is_public: true,
  times_completed: 3,
  tags: [],
  exercise_count: 5,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}

const mockRoutineResult = {
  routine: mockRoutine,
  exercises: [
    { id: 1, exercise_id: 1, exercise_name: 'Sentadilla', order_index: 1, sets: 5, reps: 5, rest_seconds: 180 },
  ],
} as any

describe('RoutineService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('devuelve todas las rutinas del usuario', async () => {
      vi.mocked(RoutineModel.findAll).mockResolvedValue([mockRoutine])

      const result = await RoutineService.getAll(1)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Fuerza Básica con Barra')
      expect(RoutineModel.findAll).toHaveBeenCalledWith(1)
    })

    it('devuelve array vacío si no hay rutinas', async () => {
      vi.mocked(RoutineModel.findAll).mockResolvedValue([])

      const result = await RoutineService.getAll(1)
      expect(result).toHaveLength(0)
    })
  })

  describe('getById', () => {
    it('devuelve rutina con ejercicios si existe', async () => {
      vi.mocked(RoutineModel.findById).mockResolvedValue(mockRoutineResult)

      const result = await RoutineService.getById(1, 1)
      expect(result.routine.name).toBe('Fuerza Básica con Barra')
      expect(result.exercises).toHaveLength(1)
    })

    it('lanza NotFoundError si no existe', async () => {
      vi.mocked(RoutineModel.findById).mockResolvedValue(null)

      await expect(RoutineService.getById(999, 1)).rejects.toThrow('no encontrada')
    })
  })

  describe('create', () => {
    it('crea una rutina con datos válidos', async () => {
      vi.mocked(RoutineModel.create).mockResolvedValue(1)
      vi.mocked(RoutineModel.findById).mockResolvedValue(mockRoutineResult)

      const dto = { name: 'Nueva Rutina', exercises: [] }
      const result = await RoutineService.create(1, dto)
      expect(result.routine.name).toBe('Fuerza Básica con Barra')
      expect(RoutineModel.create).toHaveBeenCalledWith(1, dto)
    })

    it('lanza BadRequestError si falta el nombre', async () => {
      await expect(
        RoutineService.create(1, { name: '', exercises: [] })
      ).rejects.toThrow('nombre')
    })

    it('inicializa exercises como array vacío si no se pasa', async () => {
      vi.mocked(RoutineModel.create).mockResolvedValue(1)
      vi.mocked(RoutineModel.findById).mockResolvedValue(mockRoutineResult)

      const dto = { name: 'Sin ejercicios' } as any
      await RoutineService.create(1, dto)
      expect(dto.exercises).toEqual([])
    })
  })

  describe('update', () => {
    it('actualiza una rutina existente', async () => {
      vi.mocked(RoutineModel.findById).mockResolvedValue(mockRoutineResult)
      vi.mocked(RoutineModel.update).mockResolvedValue(undefined)

      const result = await RoutineService.update(1, 1, { name: 'Actualizada' })
      expect(result.routine).toBeDefined()
    })

    it('lanza NotFoundError si no existe', async () => {
      vi.mocked(RoutineModel.findById).mockResolvedValueOnce(null)

      await expect(
        RoutineService.update(999, 1, { name: 'Test' })
      ).rejects.toThrow('no encontrada')
    })
  })

  describe('delete', () => {
    it('elimina una rutina existente', async () => {
      vi.mocked(RoutineModel.delete).mockResolvedValue(true)

      await expect(RoutineService.delete(1, 1)).resolves.toBeUndefined()
    })

    it('lanza NotFoundError si no se pudo eliminar', async () => {
      vi.mocked(RoutineModel.delete).mockResolvedValue(false)

      await expect(RoutineService.delete(999, 1)).rejects.toThrow('no encontrada')
    })
  })
})
