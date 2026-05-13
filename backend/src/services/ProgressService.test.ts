import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProgressService } from './ProgressService'
import { ProgressModel } from '../models/ProgressModel'

vi.mock('../models/ProgressModel', () => ({
  ProgressModel: {
    getFrequency: vi.fn(),
    getVolume: vi.fn(),
    getDuration: vi.fn(),
    getMuscleDistribution: vi.fn(),
    getTrainedExercises: vi.fn(),
    getExerciseProgression: vi.fn(),
    getPersonalRecords: vi.fn(),
    get1RMProgression: vi.fn(),
    getStreakStats: vi.fn(),
  },
}))

describe('ProgressService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCharts', () => {
    it('devuelve las 4 series de datos de gráficas', async () => {
      vi.mocked(ProgressModel.getFrequency).mockResolvedValue([{ date: '2024-01-01', sessions: 1 }])
      vi.mocked(ProgressModel.getVolume).mockResolvedValue([{ date: '2024-01-01', volume_kg: 5000 }])
      vi.mocked(ProgressModel.getDuration).mockResolvedValue([{ date: '2024-01-01', duration_min: 60 }])
      vi.mocked(ProgressModel.getMuscleDistribution).mockResolvedValue([{ muscle_group: 'chest', sets: 3 }])

      const result = await ProgressService.getCharts(1, 30)
      expect(result.frequency).toHaveLength(1)
      expect(result.volume).toHaveLength(1)
      expect(result.duration).toHaveLength(1)
      expect(result.muscles).toHaveLength(1)
    })

    it('llama a todos los modelos con los parámetros correctos', async () => {
      vi.mocked(ProgressModel.getFrequency).mockResolvedValue([])
      vi.mocked(ProgressModel.getVolume).mockResolvedValue([])
      vi.mocked(ProgressModel.getDuration).mockResolvedValue([])
      vi.mocked(ProgressModel.getMuscleDistribution).mockResolvedValue([])

      await ProgressService.getCharts(1, 7)
      expect(ProgressModel.getFrequency).toHaveBeenCalledWith(1, 7)
      expect(ProgressModel.getVolume).toHaveBeenCalledWith(1, 7)
      expect(ProgressModel.getDuration).toHaveBeenCalledWith(1, 7)
      expect(ProgressModel.getMuscleDistribution).toHaveBeenCalledWith(1, 7)
    })
  })

  describe('getStats', () => {
    it('calcula badges correctamente con stats reales', async () => {
      vi.mocked(ProgressModel.getStreakStats).mockResolvedValue({
        current_streak: 5,
        longest_streak: 10,
        total_workouts: 30,
        total_minutes: 350,
        last_workout_date: '2024-01-01',
      })
      vi.mocked(ProgressModel.getPersonalRecords).mockResolvedValue(
        Array.from({ length: 12 }, (_, i) => ({
          id: i, exercise_id: i, exercise_name: 'Test', value: 100,
          record_type: 'max_weight' as const, achieved_at: '2024-01-01',
        }))
      )

      const result = await ProgressService.getStats(1)
      expect(result.streak.total_workouts).toBe(30)
      expect(result.badges).toHaveLength(9)

      // Verificar badges ganados
      const earned = result.badges.filter(b => b.earned)
      expect(earned.map(b => b.id)).toContain('first_workout')
      expect(earned.map(b => b.id)).toContain('five_workouts')
      expect(earned.map(b => b.id)).toContain('twenty_workouts')
      expect(earned.map(b => b.id)).toContain('streak_3')
      expect(earned.map(b => b.id)).toContain('streak_7')
      expect(earned.map(b => b.id)).toContain('minutes_60')
      expect(earned.map(b => b.id)).toContain('minutes_300')
      expect(earned.map(b => b.id)).toContain('pr_collector')
    })

    it('devuelve stats por defecto si no hay datos', async () => {
      vi.mocked(ProgressModel.getStreakStats).mockResolvedValue(null as any)
      vi.mocked(ProgressModel.getPersonalRecords).mockResolvedValue([])

      const result = await ProgressService.getStats(1)
      expect(result.streak.current_streak).toBe(0)
      expect(result.streak.total_workouts).toBe(0)
      expect(result.badges.every(b => !b.earned)).toBe(true)
    })

    it('badge streak_30 no se gana con racha de 10', async () => {
      vi.mocked(ProgressModel.getStreakStats).mockResolvedValue({
        current_streak: 10,
        longest_streak: 10,
        total_workouts: 10,
        total_minutes: 100,
        last_workout_date: '2024-01-01',
      })
      vi.mocked(ProgressModel.getPersonalRecords).mockResolvedValue([])

      const result = await ProgressService.getStats(1)
      const streak30 = result.badges.find(b => b.id === 'streak_30')
      expect(streak30?.earned).toBe(false)
    })
  })

  describe('getRecords', () => {
    it('delega al modelo', async () => {
      const mockRecords = [{ id: 1, exercise_id: 1, exercise_name: 'Bench', value: 100, record_type: 'max_weight' as const, achieved_at: '2024-01-01' }]
      vi.mocked(ProgressModel.getPersonalRecords).mockResolvedValue(mockRecords)

      const result = await ProgressService.getRecords(1)
      expect(result).toEqual(mockRecords)
      expect(ProgressModel.getPersonalRecords).toHaveBeenCalledWith(1)
    })
  })
})
