import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { pool } from '../config'
import { CreateRoutineDTO, CreateRoutineExerciseDTO, Routine, RoutineExercise } from '../types/entities/Routine'

// ─── Find all routines for a user ────────────────────────────
export const findAllRoutines = async (userId: number): Promise<Routine[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT r.*,
       (SELECT COUNT(*) FROM routine_exercises WHERE routine_id = r.id) AS exercise_count
     FROM routines r
     WHERE r.user_id = ?
     ORDER BY r.updated_at DESC`,
    [userId]
  )
  return rows.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]') })) as Routine[]
}

// ─── Find one routine with all exercises (full JOIN) ─────────
export const findRoutineById = async (id: number, userId: number): Promise<{ routine: Routine; exercises: RoutineExercise[] } | null> => {
  const [routineRows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM routines WHERE id = ? AND user_id = ?',
    [id, userId]
  )
  if (!routineRows.length) return null

  const routine = { ...routineRows[0], tags: JSON.parse(routineRows[0].tags || '[]') } as Routine

  const [exRows] = await pool.query<RowDataPacket[]>(
    `SELECT
       re.id           AS re_id,
       re.exercise_id,
       re.order_index,
       re.sets,
       re.reps,
       re.duration_seconds,
       re.rest_seconds,
       re.weight_suggestion,
       re.notes        AS notes,
       re.superset_group,
       e.name          AS exercise_name,
       e.category,
       e.muscle_group,
       e.difficulty,
       e.requires_equipment,
       e.is_unilateral,
       e.notes         AS exercise_notes
     FROM routine_exercises re
     JOIN exercises e ON e.id = re.exercise_id
     WHERE re.routine_id = ?
     ORDER BY re.order_index`,
    [id]
  )

  return { routine, exercises: exRows as RoutineExercise[] }
}

// ─── Create routine ───────────────────────────────────────────
export const createRoutine = async (userId: number, data: CreateRoutineDTO): Promise<number> => {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO routines (user_id, name, description, goal, difficulty,
        estimated_duration_min, warmup_notes, cooldown_notes, is_public, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        data.name,
        data.description ?? null,
        data.goal ?? null,
        data.difficulty ?? 'medium',
        data.estimated_duration_min ?? null,
        data.warmup_notes ?? null,
        data.cooldown_notes ?? null,
        data.is_public ?? false,
        JSON.stringify(data.tags ?? []),
      ]
    )

    const routineId = result.insertId
    await insertRoutineExercises(conn, routineId, data.exercises)

    await conn.commit()
    return routineId
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ─── Update routine ───────────────────────────────────────────
export const updateRoutine = async (id: number, userId: number, data: Partial<CreateRoutineDTO>): Promise<void> => {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    await conn.query(
      `UPDATE routines SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        goal = COALESCE(?, goal),
        difficulty = COALESCE(?, difficulty),
        estimated_duration_min = COALESCE(?, estimated_duration_min),
        warmup_notes = COALESCE(?, warmup_notes),
        cooldown_notes = COALESCE(?, cooldown_notes),
        is_public = COALESCE(?, is_public),
        tags = COALESCE(?, tags)
       WHERE id = ? AND user_id = ?`,
      [
        data.name ?? null,
        data.description ?? null,
        data.goal ?? null,
        data.difficulty ?? null,
        data.estimated_duration_min ?? null,
        data.warmup_notes ?? null,
        data.cooldown_notes ?? null,
        data.is_public ?? null,
        data.tags ? JSON.stringify(data.tags) : null,
        id,
        userId,
      ]
    )

    if (data.exercises !== undefined) {
      await conn.query('DELETE FROM routine_exercises WHERE routine_id = ?', [id])
      await insertRoutineExercises(conn, id, data.exercises)
    }

    await conn.commit()
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ─── Delete routine ───────────────────────────────────────────
export const deleteRoutine = async (id: number, userId: number): Promise<boolean> => {
  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM routines WHERE id = ? AND user_id = ?',
    [id, userId]
  )
  return result.affectedRows > 0
}

// ─── Helper: insert exercises into routine ────────────────────
async function insertRoutineExercises(
  conn: Awaited<ReturnType<typeof pool.getConnection>>,
  routineId: number,
  exercises: CreateRoutineExerciseDTO[]
): Promise<void> {
  if (!exercises.length) return
  const values = exercises.map(ex => [
    routineId,
    ex.exercise_id,
    ex.order_index,
    ex.sets ?? 3,
    ex.reps ?? null,
    ex.duration_seconds ?? null,
    ex.rest_seconds ?? 60,
    ex.weight_suggestion ?? null,
    ex.notes ?? null,
    ex.superset_group ?? null,
  ])
  await conn.query(
    `INSERT INTO routine_exercises
       (routine_id, exercise_id, order_index, sets, reps, duration_seconds,
        rest_seconds, weight_suggestion, notes, superset_group)
     VALUES ?`,
    [values]
  )
}
