import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { pool } from '../config'
import { CreateRoutineDTO, CreateRoutineExerciseDTO, Routine, RoutineExercise } from '../types/entities/Routine'
import { applySetPlan, parseSetPlan } from '../utils/setPlan'

// is_hidden y position salen de las preferencias del usuario (user_routine_prefs)
const toRoutine = (row: RowDataPacket): Routine => ({
  ...row,
  tags: Array.isArray(row.tags) ? row.tags : [],
  is_hidden: Boolean(row.is_hidden),
  position: row.position ?? null,
}) as Routine

// ─── Find all routines for a user (incluye rutinas públicas) ─
// Por defecto excluye las que el usuario ha ocultado; con includeHidden salen
// todas y cada una lleva is_hidden.
// Orden: primero las que el usuario aún no ha colocado (las más nuevas arriba,
// así una rutina recién creada o importada sale la primera) y luego su orden manual.
export const findAllRoutines = async (userId: number, { includeHidden = false } = {}): Promise<Routine[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT r.*,
       (SELECT COUNT(*) FROM routine_exercises WHERE routine_id = r.id) AS exercise_count,
       COALESCE(p.hidden, false) AS is_hidden,
       p.position
     FROM routines r
     LEFT JOIN user_routine_prefs p ON p.routine_id = r.id AND p.user_id = ?
     WHERE (r.user_id = ? OR r.is_public = true)
       ${includeHidden ? '' : 'AND COALESCE(p.hidden, false) = false'}
     ORDER BY (p.position IS NOT NULL), p.position, r.created_at DESC, r.id DESC`,
    [userId, userId]
  )
  return rows.map(toRoutine)
}

// ─── Find one routine with all exercises (full JOIN) ─────────
// Devuelve la rutina aunque el usuario la haya ocultado (se puede abrir por enlace)
export const findRoutineById = async (id: number, userId: number): Promise<{ routine: Routine; exercises: RoutineExercise[] } | null> => {
  const [routineRows] = await pool.query<RowDataPacket[]>(
    `SELECT r.*, COALESCE(p.hidden, false) AS is_hidden, p.position
     FROM routines r
     LEFT JOIN user_routine_prefs p ON p.routine_id = r.id AND p.user_id = ?
     WHERE r.id = ? AND (r.user_id = ? OR r.is_public = true)`,
    [userId, id, userId]
  )
  if (!routineRows.length) return null

  const routine = toRoutine(routineRows[0])

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
       re.set_plan,
       re.notes        AS notes,
       re.superset_group,
       e.name          AS exercise_name,
       e.category,
       e.muscle_group,
       e.secondary_muscles,
       e.description,
       e.instructions,
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

  const exercises = exRows.map(ex => ({ ...ex, set_plan: parseSetPlan(ex.set_plan) })) as RoutineExercise[]
  return { routine, exercises }
}

// ─── Create routine ───────────────────────────────────────────
export const createRoutine = async (userId: number, data: CreateRoutineDTO): Promise<number> => {
  const [routineId] = await createRoutines(userId, [data])
  return routineId
}

// ─── Create several routines in one transaction ──────────────
export const createRoutines = async (userId: number, routines: CreateRoutineDTO[]): Promise<number[]> => {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const ids: number[] = []
    for (const data of routines) {
      ids.push(await insertRoutine(conn, userId, data))
    }

    await conn.commit()
    return ids
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

// ─── Hide / unhide a routine for a user (idempotentes) ───────
// hidden_at conserva la fecha de la primera vez que se ocultó
export const hideRoutine = async (id: number, userId: number): Promise<void> => {
  await pool.query(
    `INSERT INTO user_routine_prefs (user_id, routine_id, hidden, hidden_at)
     VALUES (?, ?, true, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE
       hidden_at = IF(hidden, hidden_at, CURRENT_TIMESTAMP),
       hidden = true`,
    [userId, id]
  )
}

export const unhideRoutine = async (id: number, userId: number): Promise<void> => {
  await pool.query(
    'UPDATE user_routine_prefs SET hidden = false, hidden_at = NULL WHERE user_id = ? AND routine_id = ?',
    [userId, id]
  )
}

// ─── Ids visibles para el usuario (propias o públicas) de entre los dados ─
export const findVisibleRoutineIds = async (ids: number[], userId: number): Promise<number[]> => {
  if (!ids.length) return []
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM routines WHERE id IN (?) AND (user_id = ? OR is_public = true)',
    [ids, userId]
  )
  return rows.map(r => r.id as number)
}

// ─── Orden manual de la lista: position = índice en routineIds ─
// Solo toca las rutinas enviadas; el resto conserva su posición.
export const setRoutineOrder = async (userId: number, routineIds: number[]): Promise<void> => {
  if (!routineIds.length) return
  const values = routineIds.map((routineId, index) => [userId, routineId, index])
  await pool.query(
    `INSERT INTO user_routine_prefs (user_id, routine_id, position) VALUES ?
     ON DUPLICATE KEY UPDATE position = VALUES(position)`,
    [values]
  )
}

// ─── Helper: insert routine + its exercises ───────────────────
async function insertRoutine(
  conn: Awaited<ReturnType<typeof pool.getConnection>>,
  userId: number,
  data: CreateRoutineDTO
): Promise<number> {
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
  await insertRoutineExercises(conn, result.insertId, data.exercises)
  return result.insertId
}

// ─── Helper: insert exercises into routine ────────────────────
async function insertRoutineExercises(
  conn: Awaited<ReturnType<typeof pool.getConnection>>,
  routineId: number,
  exercises: CreateRoutineExerciseDTO[]
): Promise<void> {
  if (!exercises.length) return
  const values = exercises.map(applySetPlan).map(ex => [
    routineId,
    ex.exercise_id,
    ex.order_index,
    ex.sets ?? 3,
    ex.reps ?? null,
    ex.duration_seconds ?? null,
    ex.rest_seconds ?? 60,
    ex.weight_suggestion ?? null,
    ex.set_plan ? JSON.stringify(ex.set_plan) : null,
    ex.notes ?? null,
    ex.superset_group ?? null,
  ])
  await conn.query(
    `INSERT INTO routine_exercises
       (routine_id, exercise_id, order_index, sets, reps, duration_seconds,
        rest_seconds, weight_suggestion, set_plan, notes, superset_group)
     VALUES ?`,
    [values]
  )
}
