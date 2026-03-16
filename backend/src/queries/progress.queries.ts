import { RowDataPacket } from 'mysql2'
import { pool } from '../config'
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

// ─── Frequency (sessions per day) ─────────────────────────────
export const getFrequency = async (userId: number, days: number): Promise<FrequencyPoint[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT DATE_FORMAT(started_at, '%Y-%m-%d') AS date,
            COUNT(*) AS sessions
     FROM sessions
     WHERE user_id = ? AND status = 'completed'
       AND started_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY DATE_FORMAT(started_at, '%Y-%m-%d')
     ORDER BY date`,
    [userId, days]
  )
  return rows as FrequencyPoint[]
}

// ─── Volume (kg lifted per day) ───────────────────────────────
export const getVolume = async (userId: number, days: number): Promise<VolumePoint[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT DATE_FORMAT(s.started_at, '%Y-%m-%d') AS date,
            ROUND(COALESCE(SUM(se.reps_done * se.weight_kg), 0)) AS volume_kg
     FROM sessions s
     JOIN session_exercises se ON se.session_id = s.id
     WHERE s.user_id = ? AND s.status = 'completed'
       AND s.started_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       AND se.reps_done IS NOT NULL AND se.weight_kg IS NOT NULL
     GROUP BY DATE_FORMAT(s.started_at, '%Y-%m-%d')
     ORDER BY date`,
    [userId, days]
  )
  return rows as VolumePoint[]
}

// ─── Duration (minutes per day) ───────────────────────────────
export const getDuration = async (userId: number, days: number): Promise<DurationPoint[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT DATE_FORMAT(started_at, '%Y-%m-%d') AS date,
            ROUND(SUM(duration_seconds) / 60) AS duration_min
     FROM sessions
     WHERE user_id = ? AND status = 'completed'
       AND started_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       AND duration_seconds IS NOT NULL
     GROUP BY DATE_FORMAT(started_at, '%Y-%m-%d')
     ORDER BY date`,
    [userId, days]
  )
  return rows as DurationPoint[]
}

// ─── Muscle distribution (sets per muscle group) ─────────────
export const getMuscleDistribution = async (userId: number, days: number): Promise<MusclePoint[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT e.muscle_group, COUNT(*) AS sets
     FROM session_exercises se
     JOIN sessions s ON s.id = se.session_id
     JOIN exercises e ON e.id = se.exercise_id
     WHERE s.user_id = ? AND s.status = 'completed'
       AND s.started_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       AND e.muscle_group IS NOT NULL
     GROUP BY e.muscle_group
     ORDER BY sets DESC`,
    [userId, days]
  )
  return rows as MusclePoint[]
}

// ─── Exercises trained (selector for progression chart) ───────
export const getTrainedExercises = async (userId: number): Promise<ExerciseOption[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT e.id, e.name
     FROM session_exercises se
     JOIN sessions s ON s.id = se.session_id
     JOIN exercises e ON e.id = se.exercise_id
     WHERE s.user_id = ? AND s.status = 'completed'
     ORDER BY e.name`,
    [userId]
  )
  return rows as ExerciseOption[]
}

// ─── Exercise progression (max weight per day for one exercise) ─
export const getExerciseProgression = async (
  userId: number,
  exerciseId: number
): Promise<ProgressionPoint[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT DATE_FORMAT(s.started_at, '%Y-%m-%d') AS date,
            MAX(se.weight_kg) AS value
     FROM session_exercises se
     JOIN sessions s ON s.id = se.session_id
     WHERE s.user_id = ? AND se.exercise_id = ?
       AND s.status = 'completed' AND se.weight_kg IS NOT NULL
     GROUP BY DATE_FORMAT(s.started_at, '%Y-%m-%d')
     ORDER BY date`,
    [userId, exerciseId]
  )
  return rows as ProgressionPoint[]
}

// ─── Personal records ─────────────────────────────────────────
export const getPersonalRecords = async (userId: number): Promise<PersonalRecord[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT pr.id, pr.exercise_id, e.name AS exercise_name,
            pr.record_type, pr.value, pr.achieved_at
     FROM personal_records pr
     JOIN exercises e ON e.id = pr.exercise_id
     WHERE pr.user_id = ?
     ORDER BY pr.achieved_at DESC`,
    [userId]
  )
  return rows as PersonalRecord[]
}

// ─── Streak stats ─────────────────────────────────────────────
export const getStreakStats = async (userId: number): Promise<StreakStats | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT current_streak, longest_streak, total_workouts,
            total_minutes, last_workout_date
     FROM streaks WHERE user_id = ?`,
    [userId]
  )
  return rows.length ? (rows[0] as StreakStats) : null
}
