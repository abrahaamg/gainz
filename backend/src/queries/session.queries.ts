import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { pool } from '../config'
import { AddSetDTO, FinishSessionDTO, Session, SessionExercise } from '../types/entities/Session'

// ─── Create session ───────────────────────────────────────────
export const createSession = async (userId: number, routineId: number): Promise<number> => {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO sessions (user_id, routine_id, started_at, status)
     VALUES (?, ?, NOW(), 'in_progress')`,
    [userId, routineId]
  )
  return result.insertId
}

// ─── Get session by id ────────────────────────────────────────
export const findSessionById = async (
  sessionId: number,
  userId: number
): Promise<{ session: Session; exercises: SessionExercise[] } | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.*, r.name AS routine_name
     FROM sessions s
     LEFT JOIN routines r ON r.id = s.routine_id
     WHERE s.id = ? AND s.user_id = ?`,
    [sessionId, userId]
  )
  if (!rows.length) return null

  const [exRows] = await pool.query<RowDataPacket[]>(
    `SELECT se.*, e.name AS exercise_name, e.category, e.muscle_group
     FROM session_exercises se
     JOIN exercises e ON e.id = se.exercise_id
     WHERE se.session_id = ?
     ORDER BY se.exercise_id, se.set_number`,
    [sessionId]
  )

  return { session: rows[0] as Session, exercises: exRows as SessionExercise[] }
}

// ─── List sessions for user ───────────────────────────────────
export const findUserSessions = async (userId: number, limit = 20): Promise<Session[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.*, r.name AS routine_name
     FROM sessions s
     LEFT JOIN routines r ON r.id = s.routine_id
     WHERE s.user_id = ?
     ORDER BY s.started_at DESC
     LIMIT ?`,
    [userId, limit]
  )
  return rows as Session[]
}

// ─── Add set to session + check PR ───────────────────────────
export const addSet = async (
  sessionId: number,
  userId: number,
  data: AddSetDTO
): Promise<{ new_pr: boolean }> => {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // Insert session_exercise
    await conn.query(
      `INSERT INTO session_exercises
         (session_id, exercise_id, set_number, reps_done, weight_kg,
          duration_done_sec, rpe, notes, completed, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, NOW())`,
      [
        sessionId,
        data.exercise_id,
        data.set_number,
        data.reps_done ?? null,
        data.weight_kg ?? null,
        data.duration_done_sec ?? null,
        data.rpe ?? null,
        data.notes ?? null,
      ]
    )

    let newPR = false

    // Save 1RM history (Epley formula) if we have weight and reps
    if (data.weight_kg && data.weight_kg > 0 && data.reps_done && data.reps_done > 0) {
      const estimated1rm = Math.round(data.weight_kg * (1 + data.reps_done / 30) * 100) / 100
      await conn.query(
        `INSERT INTO exercise_1rm_history (user_id, exercise_id, estimated_1rm, weight_used, reps_done, session_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, data.exercise_id, estimated1rm, data.weight_kg, data.reps_done, sessionId]
      )
    }

    // Check PR for max_weight
    if (data.weight_kg && data.weight_kg > 0) {
      const [prResult] = await conn.query<ResultSetHeader>(
        `INSERT INTO personal_records (user_id, exercise_id, record_type, value, session_id)
         VALUES (?, ?, 'max_weight', ?, ?)
         ON DUPLICATE KEY UPDATE
           value       = IF(VALUES(value) > value, VALUES(value), value),
           achieved_at = IF(VALUES(value) > value, NOW(), achieved_at),
           session_id  = IF(VALUES(value) > value, VALUES(session_id), session_id)`,
        [userId, data.exercise_id, data.weight_kg, sessionId]
      )
      // affectedRows=1 → new insert, affectedRows=2 → updated (new PR)
      if (prResult.affectedRows >= 1) newPR = true
    }

    // Check PR for max_reps (no weight exercises)
    if (data.reps_done && data.reps_done > 0 && (!data.weight_kg || data.weight_kg === 0)) {
      const [prResult] = await conn.query<ResultSetHeader>(
        `INSERT INTO personal_records (user_id, exercise_id, record_type, value, session_id)
         VALUES (?, ?, 'max_reps', ?, ?)
         ON DUPLICATE KEY UPDATE
           value       = IF(VALUES(value) > value, VALUES(value), value),
           achieved_at = IF(VALUES(value) > value, NOW(), achieved_at),
           session_id  = IF(VALUES(value) > value, VALUES(session_id), session_id)`,
        [userId, data.exercise_id, data.reps_done, sessionId]
      )
      if (prResult.affectedRows >= 1) newPR = true
    }

    // Check PR for max_duration
    if (data.duration_done_sec && data.duration_done_sec > 0) {
      const [prResult] = await conn.query<ResultSetHeader>(
        `INSERT INTO personal_records (user_id, exercise_id, record_type, value, session_id)
         VALUES (?, ?, 'max_duration', ?, ?)
         ON DUPLICATE KEY UPDATE
           value       = IF(VALUES(value) > value, VALUES(value), value),
           achieved_at = IF(VALUES(value) > value, NOW(), achieved_at),
           session_id  = IF(VALUES(value) > value, VALUES(session_id), session_id)`,
        [userId, data.exercise_id, data.duration_done_sec, sessionId]
      )
      if (prResult.affectedRows >= 1) newPR = true
    }

    await conn.commit()
    return { new_pr: newPR }
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ─── Last performance for Smart Fill ─────────────────────────
export const getLastPerformance = async (
  userId: number,
  exerciseId: number
): Promise<{ weight_kg: number | null; reps_done: number | null; rpe: number | null } | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT se.weight_kg, se.reps_done, se.rpe
     FROM session_exercises se
     JOIN sessions s ON s.id = se.session_id
     WHERE s.user_id = ? AND se.exercise_id = ? AND se.completed = true
     ORDER BY se.completed_at DESC
     LIMIT 1`,
    [userId, exerciseId]
  )
  if (!rows.length) return null
  return rows[0] as { weight_kg: number | null; reps_done: number | null; rpe: number | null }
}

// ─── Plateau detection: last 3 session volumes for exercise ──
export const getExerciseVolumes = async (
  userId: number,
  exerciseId: number
): Promise<{ volume: number }[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ROUND(COALESCE(SUM(se.reps_done * se.weight_kg), 0)) AS volume
     FROM session_exercises se
     JOIN sessions s ON s.id = se.session_id
     WHERE s.user_id = ? AND se.exercise_id = ? AND s.status = 'completed'
       AND se.reps_done IS NOT NULL AND se.weight_kg IS NOT NULL
     GROUP BY s.id
     ORDER BY s.started_at DESC
     LIMIT 3`,
    [userId, exerciseId]
  )
  return rows as { volume: number }[]
}

// ─── Finish session: update + streak + calories ───────────────
export const finishSession = async (
  sessionId: number,
  userId: number,
  data: FinishSessionDTO
): Promise<void> => {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // Get user weight for calorie calc
    const [userRows] = await conn.query<RowDataPacket[]>(
      'SELECT weight_kg FROM users WHERE id = ?',
      [userId]
    )
    const weightKg: number = userRows[0]?.weight_kg ?? 70

    // Estimate calories (MET 5 = strength, average)
    const durationMin = data.duration_seconds / 60
    const caloriesBurned = Math.round((5 * weightKg * durationMin) / 60)

    // Update session
    await conn.query(
      `UPDATE sessions
       SET status = ?, notes = ?, rating = ?,
           finished_at = NOW(), duration_seconds = ?, calories_burned = ?
       WHERE id = ? AND user_id = ?`,
      [
        data.status,
        data.notes ?? null,
        data.rating ?? null,
        data.duration_seconds,
        caloriesBurned,
        sessionId,
        userId,
      ]
    )

    // Update streak if completed (spec §5.2)
    if (data.status === 'completed') {
      const [streakRows] = await conn.query<RowDataPacket[]>(
        'SELECT * FROM streaks WHERE user_id = ?',
        [userId]
      )
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const addMinutes = Math.round(data.duration_seconds / 60)

      if (streakRows.length) {
        // Usuario ya tiene fila de streak → actualizar
        const streak = streakRows[0]

        let newStreak = streak.current_streak
        const lastDate = streak.last_workout_date ? new Date(streak.last_workout_date) : null

        if (lastDate) {
          lastDate.setHours(0, 0, 0, 0)
          const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / 86400000)
          if (diffDays === 0) {
            // Already trained today — no change to streak
            newStreak = streak.current_streak
          } else if (diffDays === 1) {
            newStreak = streak.current_streak + 1
          } else {
            newStreak = 1  // streak broken
          }
        } else {
          newStreak = 1  // first ever session
        }

        const longestStreak = Math.max(newStreak, streak.longest_streak)
        const lastWasToday = lastDate
          ? Math.floor((today.getTime() - new Date(lastDate).setHours(0, 0, 0, 0)) / 86400000) === 0
          : false

        await conn.query(
          `UPDATE streaks SET
             current_streak    = ?,
             longest_streak    = ?,
             last_workout_date = ?,
             total_workouts    = total_workouts + ?,
             total_minutes     = total_minutes + ?,
             updated_at        = NOW()
           WHERE user_id = ?`,
          [
            newStreak,
            longestStreak,
            today.toISOString().split('T')[0],
            lastWasToday ? 0 : 1,  // don't double-count if already trained today
            addMinutes,
            userId,
          ]
        )
      } else {
        // Usuario nuevo (registrado vía Firebase real) → crear fila de streak
        await conn.query(
          `INSERT INTO streaks (user_id, current_streak, longest_streak, last_workout_date,
                                total_workouts, total_minutes, updated_at)
           VALUES (?, 1, 1, ?, 1, ?, NOW())`,
          [userId, today.toISOString().split('T')[0], addMinutes]
        )
      }
    }

    await conn.commit()
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}
