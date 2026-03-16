import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { pool } from '../config'
import { CreateEquipmentDTO, Equipment, Recommendation } from '../types/entities/Equipment'

// ─── CRUD ─────────────────────────────────────────────────────
export const findUserEquipment = async (userId: number): Promise<Equipment[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM equipment WHERE user_id = ? ORDER BY category, name',
    [userId]
  )
  return rows as Equipment[]
}

export const createEquipment = async (userId: number, data: CreateEquipmentDTO): Promise<Equipment> => {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO equipment (user_id, name, category, quantity, weight_kg, location, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      data.name,
      data.category ?? null,
      data.quantity ?? 1,
      data.weight_kg ?? null,
      data.location ?? 'home',
      data.notes ?? null,
    ]
  )
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM equipment WHERE id = ?',
    [result.insertId]
  )
  return rows[0] as Equipment
}

export const updateEquipment = async (
  id: number,
  userId: number,
  data: Partial<CreateEquipmentDTO>
): Promise<Equipment | null> => {
  await pool.query(
    `UPDATE equipment SET
       name     = COALESCE(?, name),
       category = COALESCE(?, category),
       quantity = COALESCE(?, quantity),
       weight_kg = COALESCE(?, weight_kg),
       location = COALESCE(?, location),
       notes    = COALESCE(?, notes)
     WHERE id = ? AND user_id = ?`,
    [
      data.name ?? null,
      data.category ?? null,
      data.quantity ?? null,
      data.weight_kg ?? null,
      data.location ?? null,
      data.notes ?? null,
      id,
      userId,
    ]
  )
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM equipment WHERE id = ? AND user_id = ?',
    [id, userId]
  )
  return rows.length ? (rows[0] as Equipment) : null
}

export const deleteEquipment = async (id: number, userId: number): Promise<boolean> => {
  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM equipment WHERE id = ? AND user_id = ?',
    [id, userId]
  )
  return result.affectedRows > 0
}

// ─── Count accessible exercises ──────────────────────────────
export const countAccessibleExercises = async (userId: number): Promise<number> => {
  const equipment = await findUserEquipment(userId)
  const names = equipment.map(e => e.name)

  if (!names.length) {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS cnt FROM exercises WHERE requires_equipment = false'
    )
    return rows[0].cnt as number
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(DISTINCT e.id) AS cnt
     FROM exercises e
     LEFT JOIN exercise_equipment ee ON ee.exercise_id = e.id
     WHERE e.requires_equipment = false
        OR ee.equipment_name IN (?)`,
    [names]
  )
  return rows[0].cnt as number
}

// ─── Recommendations (spec §5.5) ─────────────────────────────
export const findRecommendations = async (
  userId: number,
  filters: { goal?: string; difficulty?: string } = {}
): Promise<Recommendation[]> => {
  const equipment = await findUserEquipment(userId)
  const names = equipment.map(e => e.name)

  // Build WHERE clause for filters
  const conditions: string[] = ['r.is_public = true', 'r.user_id != ?']
  const params: unknown[] = [userId]

  if (filters.goal)       { conditions.push('r.goal = ?');       params.push(filters.goal) }
  if (filters.difficulty) { conditions.push('r.difficulty = ?'); params.push(filters.difficulty) }

  const whereClause = conditions.join(' AND ')

  let sql: string
  let queryParams: unknown[]

  if (!names.length) {
    // No equipment: only bodyweight-compatible routines
    sql = `
      SELECT
        r.id, r.name, r.description, r.goal, r.difficulty,
        r.estimated_duration_min, r.times_completed,
        COUNT(DISTINCT re.exercise_id) AS total_exercises,
        COUNT(DISTINCT CASE WHEN e.requires_equipment = false THEN re.exercise_id END) AS compatible_exercises,
        ROUND(
          COUNT(DISTINCT CASE WHEN e.requires_equipment = false THEN re.exercise_id END)
          * 100.0 / NULLIF(COUNT(DISTINCT re.exercise_id), 0)
        ) AS compatibility_pct
      FROM routines r
      JOIN routine_exercises re ON r.id = re.routine_id
      JOIN exercises e ON re.exercise_id = e.id
      WHERE ${whereClause}
      GROUP BY r.id
      HAVING compatibility_pct >= 50
      ORDER BY compatibility_pct DESC, r.times_completed DESC
      LIMIT 10`
    queryParams = params
  } else {
    sql = `
      SELECT
        r.id, r.name, r.description, r.goal, r.difficulty,
        r.estimated_duration_min, r.times_completed,
        COUNT(DISTINCT re.exercise_id) AS total_exercises,
        COUNT(DISTINCT CASE
          WHEN e.requires_equipment = false OR ee.equipment_name IN (?)
          THEN re.exercise_id
        END) AS compatible_exercises,
        ROUND(
          COUNT(DISTINCT CASE
            WHEN e.requires_equipment = false OR ee.equipment_name IN (?)
            THEN re.exercise_id
          END) * 100.0 / NULLIF(COUNT(DISTINCT re.exercise_id), 0)
        ) AS compatibility_pct
      FROM routines r
      JOIN routine_exercises re ON r.id = re.routine_id
      JOIN exercises e ON re.exercise_id = e.id
      LEFT JOIN exercise_equipment ee ON e.id = ee.exercise_id
      WHERE ${whereClause}
      GROUP BY r.id
      HAVING compatibility_pct >= 70
      ORDER BY compatibility_pct DESC, r.times_completed DESC
      LIMIT 10`
    queryParams = [names, names, ...params]
  }

  const [rows] = await pool.query<RowDataPacket[]>(sql, queryParams)
  return rows as Recommendation[]
}
