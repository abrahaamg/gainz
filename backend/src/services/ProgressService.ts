import { ProgressModel } from '../models/ProgressModel'
import { Badge, StreakStats } from '../types/entities/Progress'

const BADGE_DEFS: Omit<Badge, 'earned'>[] = [
  { id: 'first_workout',   icon: '🎉', label: 'Primer entreno',      description: 'Completa tu primer entrenamiento' },
  { id: 'five_workouts',   icon: '💪', label: '5 entrenamientos',    description: 'Completa 5 entrenamientos' },
  { id: 'twenty_workouts', icon: '🏅', label: '25 entrenamientos',   description: 'Completa 25 entrenamientos' },
  { id: 'streak_3',        icon: '🔥', label: 'Racha de 3 días',     description: 'Mantén una racha de 3 días' },
  { id: 'streak_7',        icon: '⚡', label: 'Racha semanal',       description: 'Mantén una racha de 7 días' },
  { id: 'streak_30',       icon: '👑', label: 'Racha mensual',       description: 'Mantén una racha de 30 días' },
  { id: 'minutes_60',      icon: '⏱️', label: '1 hora entrenada',    description: 'Acumula 60 minutos de entrenamiento' },
  { id: 'minutes_300',     icon: '🕐', label: '5 horas entrenadas',  description: 'Acumula 300 minutos de entrenamiento' },
  { id: 'pr_collector',    icon: '🏆', label: 'Récords personales',  description: 'Establece 10 récords personales' },
]

function buildBadges(stats: StreakStats, prCount: number): Badge[] {
  return BADGE_DEFS.map(def => {
    let earned = false
    switch (def.id) {
      case 'first_workout':   earned = stats.total_workouts >= 1;  break
      case 'five_workouts':   earned = stats.total_workouts >= 5;  break
      case 'twenty_workouts': earned = stats.total_workouts >= 25; break
      case 'streak_3':        earned = stats.longest_streak >= 3;  break
      case 'streak_7':        earned = stats.longest_streak >= 7;  break
      case 'streak_30':       earned = stats.longest_streak >= 30; break
      case 'minutes_60':      earned = stats.total_minutes >= 60;  break
      case 'minutes_300':     earned = stats.total_minutes >= 300; break
      case 'pr_collector':    earned = prCount >= 10;              break
    }
    return { ...def, earned }
  })
}

export const ProgressService = {
  getCharts: async (userId: number, days: number) => {
    const [frequency, volume, duration, muscles] = await Promise.all([
      ProgressModel.getFrequency(userId, days),
      ProgressModel.getVolume(userId, days),
      ProgressModel.getDuration(userId, days),
      ProgressModel.getMuscleDistribution(userId, days),
    ])
    return { frequency, volume, duration, muscles }
  },

  getTrainedExercises: (userId: number) => ProgressModel.getTrainedExercises(userId),

  getExerciseProgression: (userId: number, exerciseId: number) =>
    ProgressModel.getExerciseProgression(userId, exerciseId),

  getRecords: (userId: number) => ProgressModel.getPersonalRecords(userId),

  get1RMProgression: (userId: number, exerciseId: number) =>
    ProgressModel.get1RMProgression(userId, exerciseId),

  getStats: async (userId: number) => {
    const [stats, records] = await Promise.all([
      ProgressModel.getStreakStats(userId),
      ProgressModel.getPersonalRecords(userId),
    ])
    const defaultStats: StreakStats = {
      current_streak: 0,
      longest_streak: 0,
      total_workouts: 0,
      total_minutes: 0,
      last_workout_date: null,
    }
    const s = stats ?? defaultStats
    const badges = buildBadges(s, records.length)
    return { streak: s, badges }
  },
}
