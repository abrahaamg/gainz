import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RoutineService } from './RoutineService'
import * as q from '../queries/routine.queries'

vi.mock('../queries/routine.queries', () => ({
  findAllRoutines: vi.fn(),
  findRoutineById: vi.fn(),
  createRoutine: vi.fn(),
  updateRoutine: vi.fn(),
  deleteRoutine: vi.fn(),
  hideRoutine: vi.fn(),
  unhideRoutine: vi.fn(),
  findVisibleRoutineIds: vi.fn(),
  setRoutineOrder: vi.fn(),
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
  is_hidden: false,
  position: null,
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
      vi.mocked(q.findAllRoutines).mockResolvedValue([mockRoutine])

      const result = await RoutineService.getAll(1)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Fuerza Básica con Barra')
      expect(q.findAllRoutines).toHaveBeenCalledWith(1, {})
    })

    it('pasa includeHidden a la query', async () => {
      vi.mocked(q.findAllRoutines).mockResolvedValue([])

      await RoutineService.getAll(1, { includeHidden: true })
      expect(q.findAllRoutines).toHaveBeenCalledWith(1, { includeHidden: true })
    })

    it('devuelve array vacío si no hay rutinas', async () => {
      vi.mocked(q.findAllRoutines).mockResolvedValue([])

      const result = await RoutineService.getAll(1)
      expect(result).toHaveLength(0)
    })
  })

  describe('getById', () => {
    it('devuelve rutina con ejercicios si existe', async () => {
      vi.mocked(q.findRoutineById).mockResolvedValue(mockRoutineResult)

      const result = await RoutineService.getById(1, 1)
      expect(result.routine.name).toBe('Fuerza Básica con Barra')
      expect(result.exercises).toHaveLength(1)
    })

    it('lanza NotFoundError si no existe', async () => {
      vi.mocked(q.findRoutineById).mockResolvedValue(null)

      await expect(RoutineService.getById(999, 1)).rejects.toThrow('no encontrada')
    })
  })

  describe('create', () => {
    it('crea una rutina con datos válidos', async () => {
      vi.mocked(q.createRoutine).mockResolvedValue(1)
      vi.mocked(q.findRoutineById).mockResolvedValue(mockRoutineResult)

      const dto = { name: 'Nueva Rutina', exercises: [] }
      const result = await RoutineService.create(1, dto)
      expect(result.routine.name).toBe('Fuerza Básica con Barra')
      expect(q.createRoutine).toHaveBeenCalledWith(1, dto)
    })

    it('lanza BadRequestError si falta el nombre', async () => {
      await expect(
        RoutineService.create(1, { name: '', exercises: [] })
      ).rejects.toThrow('nombre')
    })

    it('inicializa exercises como array vacío si no se pasa', async () => {
      vi.mocked(q.createRoutine).mockResolvedValue(1)
      vi.mocked(q.findRoutineById).mockResolvedValue(mockRoutineResult)

      const dto = { name: 'Sin ejercicios' } as any
      await RoutineService.create(1, dto)
      expect(dto.exercises).toEqual([])
    })
  })

  describe('update', () => {
    it('actualiza una rutina existente', async () => {
      vi.mocked(q.findRoutineById).mockResolvedValue(mockRoutineResult)
      vi.mocked(q.updateRoutine).mockResolvedValue(undefined)

      const result = await RoutineService.update(1, 1, { name: 'Actualizada' })
      expect(result.routine).toBeDefined()
    })

    it('lanza ForbiddenError (403) si la rutina es pública pero de otro usuario', async () => {
      vi.mocked(q.findRoutineById).mockResolvedValue({
        ...mockRoutineResult,
        routine: { ...mockRoutine, user_id: 2, is_public: true },
      })

      await expect(
        RoutineService.update(1, 1, { exercises: [] })
      ).rejects.toMatchObject({ statusCode: 403 })
      expect(q.updateRoutine).not.toHaveBeenCalled()
    })

    it('lanza NotFoundError si no existe', async () => {
      vi.mocked(q.findRoutineById).mockResolvedValueOnce(null)

      await expect(
        RoutineService.update(999, 1, { name: 'Test' })
      ).rejects.toThrow('no encontrada')
    })
  })

  describe('delete', () => {
    it('elimina una rutina existente', async () => {
      vi.mocked(q.deleteRoutine).mockResolvedValue(true)

      await expect(RoutineService.delete(1, 1)).resolves.toBeUndefined()
    })

    it('lanza NotFoundError si no se pudo eliminar', async () => {
      vi.mocked(q.deleteRoutine).mockResolvedValue(false)

      await expect(RoutineService.delete(999, 1)).rejects.toThrow('no encontrada')
    })
  })

  describe('hide', () => {
    const foreign = { ...mockRoutineResult, routine: { ...mockRoutine, user_id: 2 } }

    it('oculta una rutina pública de otro usuario', async () => {
      vi.mocked(q.findRoutineById).mockResolvedValue(foreign)

      await expect(RoutineService.hide(1, 1)).resolves.toBeUndefined()
      expect(q.hideRoutine).toHaveBeenCalledWith(1, 1)
    })

    it('lanza 400 si la rutina es propia', async () => {
      vi.mocked(q.findRoutineById).mockResolvedValue(mockRoutineResult)

      await expect(RoutineService.hide(1, 1)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Las rutinas propias se eliminan, no se ocultan',
      })
      expect(q.hideRoutine).not.toHaveBeenCalled()
    })

    it('lanza 404 si la rutina no existe o no es visible', async () => {
      vi.mocked(q.findRoutineById).mockResolvedValue(null)

      await expect(RoutineService.hide(999, 1)).rejects.toMatchObject({ statusCode: 404 })
      expect(q.hideRoutine).not.toHaveBeenCalled()
    })
  })

  describe('unhide', () => {
    it('vuelve a mostrar una rutina', async () => {
      vi.mocked(q.findRoutineById).mockResolvedValue({ ...mockRoutineResult, routine: { ...mockRoutine, user_id: 2 } })

      await expect(RoutineService.unhide(1, 1)).resolves.toBeUndefined()
      expect(q.unhideRoutine).toHaveBeenCalledWith(1, 1)
    })

    it('lanza 404 si la rutina no existe o no es visible', async () => {
      vi.mocked(q.findRoutineById).mockResolvedValue(null)

      await expect(RoutineService.unhide(999, 1)).rejects.toMatchObject({ statusCode: 404 })
      expect(q.unhideRoutine).not.toHaveBeenCalled()
    })
  })

  describe('reorder', () => {
    it('guarda el orden si todas las rutinas son visibles', async () => {
      vi.mocked(q.findVisibleRoutineIds).mockResolvedValue([3, 1, 2])

      await RoutineService.reorder(1, [3, 1, 2])
      expect(q.setRoutineOrder).toHaveBeenCalledWith(1, [3, 1, 2])
    })

    it('lanza 400 con los ids que no ve el usuario y no guarda nada', async () => {
      vi.mocked(q.findVisibleRoutineIds).mockResolvedValue([1])

      await expect(RoutineService.reorder(1, [1, 8, 9])).rejects.toMatchObject({
        statusCode: 400,
        message: 'Rutinas no encontradas: 8, 9',
      })
      expect(q.setRoutineOrder).not.toHaveBeenCalled()
    })
  })
})
