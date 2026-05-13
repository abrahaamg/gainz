import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SessionService } from './SessionService'
import { SessionModel } from '../models/SessionModel'

vi.mock('../models/SessionModel', () => ({
  SessionModel: {
    create: vi.fn(),
    findById: vi.fn(),
    findByUser: vi.fn(),
    addSet: vi.fn(),
    finish: vi.fn(),
    getLastPerformance: vi.fn(),
    getExerciseVolumes: vi.fn(),
  },
}))

const mockSession = {
  id: 1,
  user_id: 1,
  routine_id: 1,
  routine_name: 'Fuerza Básica',
  started_at: '2024-01-01T10:00:00',
  finished_at: null,
  duration_seconds: null,
  calories_burned: null,
  notes: null,
  rating: null,
  status: 'in_progress' as const,
}

const mockSessionResult = {
  session: mockSession,
  exercises: [],
}

describe('SessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('crea una sesión con routine_id válido', async () => {
      vi.mocked(SessionModel.create).mockResolvedValue(1)

      const result = await SessionService.create(1, 5)
      expect(result).toBe(1)
      expect(SessionModel.create).toHaveBeenCalledWith(1, 5)
    })

    it('lanza BadRequestError si falta routine_id', async () => {
      await expect(SessionService.create(1, 0)).rejects.toThrow('routine_id')
    })
  })

  describe('getById', () => {
    it('devuelve sesión si existe', async () => {
      vi.mocked(SessionModel.findById).mockResolvedValue(mockSessionResult)

      const result = await SessionService.getById(1, 1)
      expect(result.session.id).toBe(1)
    })

    it('lanza NotFoundError si no existe', async () => {
      vi.mocked(SessionModel.findById).mockResolvedValue(null)

      await expect(SessionService.getById(999, 1)).rejects.toThrow('no encontrada')
    })
  })

  describe('getByUser', () => {
    it('devuelve lista de sesiones del usuario', async () => {
      vi.mocked(SessionModel.findByUser).mockResolvedValue([mockSession])

      const result = await SessionService.getByUser(1, 10)
      expect(result).toHaveLength(1)
      expect(SessionModel.findByUser).toHaveBeenCalledWith(1, 10)
    })
  })

  describe('addSet', () => {
    it('añade una serie con datos válidos', async () => {
      vi.mocked(SessionModel.addSet).mockResolvedValue({ new_pr: false })

      const dto = { exercise_id: 1, set_number: 1, reps_done: 10, weight_kg: 60 }
      const result = await SessionService.addSet(1, 1, dto)
      expect(result).toEqual({ new_pr: false })
    })

    it('devuelve new_pr: true cuando se bate un récord', async () => {
      vi.mocked(SessionModel.addSet).mockResolvedValue({ new_pr: true })

      const dto = { exercise_id: 1, set_number: 1, reps_done: 5, weight_kg: 120 }
      const result = await SessionService.addSet(1, 1, dto)
      expect(result.new_pr).toBe(true)
    })

    it('lanza BadRequestError si falta exercise_id', async () => {
      await expect(
        SessionService.addSet(1, 1, { exercise_id: 0, set_number: 1 } as any)
      ).rejects.toThrow('exercise_id')
    })

    it('lanza BadRequestError si falta set_number', async () => {
      await expect(
        SessionService.addSet(1, 1, { exercise_id: 1, set_number: 0 } as any)
      ).rejects.toThrow('set_number')
    })
  })

  describe('getLastPerformance', () => {
    it('devuelve rendimiento anterior sin plateau', async () => {
      vi.mocked(SessionModel.getLastPerformance).mockResolvedValue({
        weight_kg: 80, reps_done: 5, rpe: 8,
      })
      vi.mocked(SessionModel.getExerciseVolumes).mockResolvedValue([
        { volume: 2000 }, { volume: 1800 },
      ])

      const result = await SessionService.getLastPerformance(1, 1)
      expect(result.weight_kg).toBe(80)
      expect(result.plateau_detected).toBe(false)
    })

    it('detecta plateau si 3 sesiones con volumen estancado', async () => {
      vi.mocked(SessionModel.getLastPerformance).mockResolvedValue({
        weight_kg: 80, reps_done: 5, rpe: 8,
      })
      vi.mocked(SessionModel.getExerciseVolumes).mockResolvedValue([
        { volume: 1800 }, { volume: 1900 }, { volume: 2000 },
      ])

      const result = await SessionService.getLastPerformance(1, 1)
      expect(result.plateau_detected).toBe(true)
    })

    it('no detecta plateau con menos de 3 sesiones', async () => {
      vi.mocked(SessionModel.getLastPerformance).mockResolvedValue({
        weight_kg: 80, reps_done: 5, rpe: 8,
      })
      vi.mocked(SessionModel.getExerciseVolumes).mockResolvedValue([
        { volume: 2000 },
      ])

      const result = await SessionService.getLastPerformance(1, 1)
      expect(result.plateau_detected).toBe(false)
    })

    it('devuelve nulls si no hay rendimiento previo', async () => {
      vi.mocked(SessionModel.getLastPerformance).mockResolvedValue(null)
      vi.mocked(SessionModel.getExerciseVolumes).mockResolvedValue([])

      const result = await SessionService.getLastPerformance(1, 1)
      expect(result.weight_kg).toBeNull()
      expect(result.reps_done).toBeNull()
      expect(result.plateau_detected).toBe(false)
    })
  })

  describe('finish', () => {
    it('finaliza una sesión en progreso', async () => {
      vi.mocked(SessionModel.findById)
        .mockResolvedValueOnce(mockSessionResult) // check existing
        .mockResolvedValueOnce({
          session: { ...mockSession, status: 'completed', finished_at: '2024-01-01T11:00:00' },
          exercises: [],
        })
      vi.mocked(SessionModel.finish).mockResolvedValue(undefined)

      const result = await SessionService.finish(1, 1, {
        status: 'completed', rating: 4, notes: 'Buen entreno', duration_seconds: 3600,
      })
      expect(result.session.status).toBe('completed')
    })

    it('lanza NotFoundError si la sesión no existe', async () => {
      vi.mocked(SessionModel.findById).mockResolvedValue(null)

      await expect(
        SessionService.finish(999, 1, { status: 'completed', duration_seconds: 0 })
      ).rejects.toThrow('no encontrada')
    })

    it('lanza BadRequestError si la sesión ya fue finalizada', async () => {
      vi.mocked(SessionModel.findById).mockResolvedValue({
        session: { ...mockSession, status: 'completed' },
        exercises: [],
      })

      await expect(
        SessionService.finish(1, 1, { status: 'completed', duration_seconds: 0 })
      ).rejects.toThrow('ya fue finalizada')
    })
  })
})
