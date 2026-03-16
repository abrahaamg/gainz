import * as q from '../queries/progress.queries'
import {
  FrequencyPoint,
  VolumePoint,
  DurationPoint,
  MusclePoint,
  ProgressionPoint,
  PersonalRecord,
  StreakStats,
  ExerciseOption,
} from '../types/entities/Progress'

export const ProgressModel = {
  getFrequency:           (userId: number, days: number): Promise<FrequencyPoint[]>    => q.getFrequency(userId, days),
  getVolume:              (userId: number, days: number): Promise<VolumePoint[]>        => q.getVolume(userId, days),
  getDuration:            (userId: number, days: number): Promise<DurationPoint[]>      => q.getDuration(userId, days),
  getMuscleDistribution:  (userId: number, days: number): Promise<MusclePoint[]>        => q.getMuscleDistribution(userId, days),
  getTrainedExercises:    (userId: number):               Promise<ExerciseOption[]>     => q.getTrainedExercises(userId),
  getExerciseProgression: (userId: number, exerciseId: number): Promise<ProgressionPoint[]> => q.getExerciseProgression(userId, exerciseId),
  getPersonalRecords:     (userId: number):               Promise<PersonalRecord[]>     => q.getPersonalRecords(userId),
  getStreakStats:         (userId: number):               Promise<StreakStats | null>   => q.getStreakStats(userId),
}
