import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { pool } from '../config'
import { Exercise, CreateExerciseDTO, UpdateExerciseDTO, ExerciseFilters } from '../types/entities/Exercise'

// ─── findAll con filtros y paginación ────────────────────────
export const findAllExercises = async (
  filters: ExerciseFilters
): Promise<{ rows: Exercise[]; total: number }> => {
  const { category, muscle, difficulty, requires_equipment, q, page = 1, limit = 20 } = filters
  const offset = (page - 1) * limit
  const conditions: string[] = []
  const params: unknown[] = []

  if (category) { conditions.push('e.category = ?'); params.push(category) }
  if (muscle)   { conditions.push('e.muscle_group = ?'); params.push(muscle) }
  if (difficulty) { conditions.push('e.difficulty = ?'); params.push(difficulty) }
  if (requires_equipment !== undefined) {
    conditions.push('e.requires_equipment = ?')
    params.push(requires_equipment ? 1 : 0)
  }
  if (q) { conditions.push('e.name LIKE ?'); params.push(`%${q}%`) }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM exercises e ${where}`,
    params
  )
  const total = (countRows[0] as { total: number }).total

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT e.*, GROUP_CONCAT(ee.equipment_name) as equipment_list
     FROM exercises e
     LEFT JOIN exercise_equipment ee ON e.id = ee.exercise_id
     ${where}
     GROUP BY e.id
     ORDER BY e.name ASC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  const exercises = (rows as Exercise[]).map((row) => ({
    ...row,
    requires_equipment: Boolean(row.requires_equipment),
    is_unilateral: Boolean(row.is_unilateral),
    is_public: Boolean(row.is_public),
    secondary_muscles: row.secondary_muscles
      ? JSON.parse(row.secondary_muscles as unknown as string)
      : [],
    equipment: (row as unknown as { equipment_list: string | null }).equipment_list
      ? (row as unknown as { equipment_list: string }).equipment_list.split(',')
      : [],
  }))

  return { rows: exercises, total }
}

// ─── findById con equipamiento ────────────────────────────────
export const findExerciseById = async (id: number): Promise<Exercise | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT e.*, GROUP_CONCAT(ee.equipment_name) as equipment_list
     FROM exercises e
     LEFT JOIN exercise_equipment ee ON e.id = ee.exercise_id
     WHERE e.id = ?
     GROUP BY e.id`,
    [id]
  )
  if (!rows[0]) return null

  const row = rows[0]
  return {
    ...(row as Exercise),
    requires_equipment: Boolean(row.requires_equipment),
    is_unilateral: Boolean(row.is_unilateral),
    is_public: Boolean(row.is_public),
    secondary_muscles: row.secondary_muscles
      ? JSON.parse(row.secondary_muscles as string)
      : [],
    equipment: row.equipment_list ? (row.equipment_list as string).split(',') : [],
  }
}

// ─── create ───────────────────────────────────────────────────
export const createExercise = async (
  data: CreateExerciseDTO,
  userId: number
): Promise<number> => {
  const {
    name, category, muscle_group,
    secondary_muscles = [], description, instructions,
    difficulty = 'medium', video_url, image_url,
    requires_equipment = false, is_unilateral = false,
    notes, is_public = true, equipment = [],
  } = data

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO exercises
       (name, category, muscle_group, secondary_muscles, description, instructions,
        difficulty, video_url, image_url, requires_equipment, is_unilateral,
        notes, created_by, is_public)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name, category, muscle_group,
      JSON.stringify(secondary_muscles), description ?? null, instructions ?? null,
      difficulty, video_url ?? null, image_url ?? null,
      requires_equipment ? 1 : 0, is_unilateral ? 1 : 0,
      notes ?? null, userId, is_public ? 1 : 0,
    ]
  )

  const exerciseId = result.insertId

  // Insert equipment relationships
  if (equipment.length > 0) {
    const equipValues = equipment.map((name) => [exerciseId, name])
    await pool.query(
      'INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name) VALUES ?',
      [equipValues]
    )
  }

  return exerciseId
}

// ─── update ───────────────────────────────────────────────────
export const updateExercise = async (
  id: number,
  data: UpdateExerciseDTO
): Promise<boolean> => {
  const { equipment, secondary_muscles, ...fields } = data
  const updateFields: Record<string, unknown> = { ...fields }

  if (secondary_muscles !== undefined) {
    updateFields.secondary_muscles = JSON.stringify(secondary_muscles)
  }
  if ('requires_equipment' in updateFields) {
    updateFields.requires_equipment = updateFields.requires_equipment ? 1 : 0
  }
  if ('is_unilateral' in updateFields) {
    updateFields.is_unilateral = updateFields.is_unilateral ? 1 : 0
  }
  if ('is_public' in updateFields) {
    updateFields.is_public = updateFields.is_public ? 1 : 0
  }

  const entries = Object.entries(updateFields).filter(([, v]) => v !== undefined)
  if (entries.length === 0 && equipment === undefined) return true

  if (entries.length > 0) {
    const setClause = entries.map(([col]) => `${col} = ?`).join(', ')
    const values = entries.map(([, v]) => v)
    await pool.query(`UPDATE exercises SET ${setClause} WHERE id = ?`, [...values, id])
  }

  // Update equipment if provided
  if (equipment !== undefined) {
    await pool.query('DELETE FROM exercise_equipment WHERE exercise_id = ?', [id])
    if (equipment.length > 0) {
      const equipValues = equipment.map((name) => [id, name])
      await pool.query(
        'INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name) VALUES ?',
        [equipValues]
      )
    }
  }

  return true
}

// ─── delete ───────────────────────────────────────────────────
export const deleteExercise = async (id: number): Promise<boolean> => {
  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM exercises WHERE id = ?',
    [id]
  )
  return result.affectedRows > 0
}
