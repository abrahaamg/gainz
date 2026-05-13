import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { pool } from '../config'
import { CreateEquipmentDTO, Equipment, CatalogItem, Recommendation } from '../types/entities/Equipment'

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
    `INSERT INTO equipment (user_id, name, catalog_name, category, quantity, weight_kg, location, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, data.name, data.catalog_name ?? null, data.category ?? null, data.quantity ?? 1, data.weight_kg ?? null, data.location ?? 'home', data.notes ?? null]
  )
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM equipment WHERE id = ?', [result.insertId])
  return rows[0] as Equipment
}

export const updateEquipment = async (id: number, userId: number, data: Partial<CreateEquipmentDTO>): Promise<Equipment | null> => {
  await pool.query(
    `UPDATE equipment SET
       name     = COALESCE(?, name),
       category = COALESCE(?, category),
       quantity = COALESCE(?, quantity),
       weight_kg = COALESCE(?, weight_kg),
       location = COALESCE(?, location),
       notes    = COALESCE(?, notes)
     WHERE id = ? AND user_id = ?`,
    [data.name ?? null, data.category ?? null, data.quantity ?? null, data.weight_kg ?? null, data.location ?? null, data.notes ?? null, id, userId]
  )
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM equipment WHERE id = ? AND user_id = ?', [id, userId])
  return rows.length ? (rows[0] as Equipment) : null
}

export const deleteEquipment = async (id: number, userId: number): Promise<boolean> => {
  const [result] = await pool.query<ResultSetHeader>('DELETE FROM equipment WHERE id = ? AND user_id = ?', [id, userId])
  return result.affectedRows > 0
}

// ─── Catalog ────────────────────────────────────────────────
export const getCatalog = async (): Promise<CatalogItem[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, name, category, icon FROM equipment_catalog ORDER BY category, name'
  )
  return rows as CatalogItem[]
}

// ─── Count bodyweight-only exercises ─────────────────────────
export const countBodyweightExercises = async (): Promise<number> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) AS cnt FROM exercises WHERE requires_equipment = false'
  )
  return rows[0].cnt as number
}

// ─── Find accessible exercises ────────────────────────────────
// An exercise is accessible if:
// 1. It's bodyweight (requires_equipment = false), OR
// 2. The user has ALL mandatory equipment for it
//    (all exercise_equipment rows where is_optional = false)
export const findAccessibleExercises = async (userId: number): Promise<RowDataPacket[]> => {
  const equipment = await findUserEquipment(userId)
  const names = equipment.map(e => e.catalog_name ?? e.name)

  if (!names.length) {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, name, muscle_group FROM exercises WHERE requires_equipment = false ORDER BY name'
    )
    return rows
  }

  // Build explicit placeholders for the IN clause
  const placeholders = names.map(() => '?').join(', ')

  // Exercises where the user has all mandatory equipment
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT e.id, e.name, e.muscle_group
     FROM exercises e
     WHERE e.requires_equipment = false
     UNION
     SELECT e.id, e.name, e.muscle_group
     FROM exercises e
     WHERE e.requires_equipment = true
       AND NOT EXISTS (
         SELECT 1 FROM exercise_equipment ee
         WHERE ee.exercise_id = e.id
           AND ee.is_optional = false
           AND ee.equipment_name NOT IN (${placeholders})
       )
       AND EXISTS (
         SELECT 1 FROM exercise_equipment ee
         WHERE ee.exercise_id = e.id
           AND ee.is_optional = false
       )
     ORDER BY name`,
    [...names]
  )
  return rows
}

// ─── Count accessible exercises ──────────────────────────────
export const countAccessibleExercises = async (userId: number): Promise<number> => {
  const rows = await findAccessibleExercises(userId)
  return rows.length
}

// ─── Find exercises with missing equipment + alternatives ─────
// Returns exercises the user can't do with their current equipment
// plus alternative exercises for the same muscle group
export const findExercisesWithAlternatives = async (userId: number): Promise<RowDataPacket[]> => {
  const equipment = await findUserEquipment(userId)
  const names = equipment.map(e => e.catalog_name ?? e.name)

  if (!names.length) {
    // User has no equipment — all equipment-requiring exercises are inaccessible
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT e.id, e.name, e.muscle_group, e.category,
              GROUP_CONCAT(DISTINCT ee.equipment_name) AS missing_equipment
       FROM exercises e
       JOIN exercise_equipment ee ON ee.exercise_id = e.id AND ee.is_optional = false
       WHERE e.requires_equipment = true
       GROUP BY e.id
       ORDER BY e.name`
    )
    return rows
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT e.id, e.name, e.muscle_group, e.category,
            GROUP_CONCAT(DISTINCT ee.equipment_name) AS missing_equipment
     FROM exercises e
     JOIN exercise_equipment ee ON ee.exercise_id = e.id
       AND ee.is_optional = false
       AND ee.equipment_name NOT IN (?)
     WHERE e.requires_equipment = true
     GROUP BY e.id
     ORDER BY e.name`,
    [names]
  )
  return rows
}

// ─── Recommendations ─────────────────────────────────────────
export const findRecommendations = async (
  userId: number,
  filters: { goal?: string; difficulty?: string } = {}
): Promise<Recommendation[]> => {
  const equipment = await findUserEquipment(userId)
  const names = equipment.map(e => e.catalog_name ?? e.name)

  const conditions: string[] = ['r.is_public = true', 'r.user_id != ?']
  const params: unknown[] = [userId]

  if (filters.goal)       { conditions.push('r.goal = ?');       params.push(filters.goal) }
  if (filters.difficulty) { conditions.push('r.difficulty = ?'); params.push(filters.difficulty) }

  const whereClause = conditions.join(' AND ')

  let sql: string
  let queryParams: unknown[]

  if (!names.length) {
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
    // An exercise in a routine is "compatible" if:
    // - it's bodyweight, OR
    // - the user has ALL mandatory equipment for it
    sql = `
      SELECT
        r.id, r.name, r.description, r.goal, r.difficulty,
        r.estimated_duration_min, r.times_completed,
        COUNT(DISTINCT re.exercise_id) AS total_exercises,
        COUNT(DISTINCT CASE
          WHEN e.requires_equipment = false THEN re.exercise_id
          WHEN e.requires_equipment = true AND NOT EXISTS (
            SELECT 1 FROM exercise_equipment ee2
            WHERE ee2.exercise_id = e.id
              AND ee2.is_optional = false
              AND ee2.equipment_name NOT IN (?)
          ) THEN re.exercise_id
        END) AS compatible_exercises,
        ROUND(
          COUNT(DISTINCT CASE
            WHEN e.requires_equipment = false THEN re.exercise_id
            WHEN e.requires_equipment = true AND NOT EXISTS (
              SELECT 1 FROM exercise_equipment ee2
              WHERE ee2.exercise_id = e.id
                AND ee2.is_optional = false
                AND ee2.equipment_name NOT IN (?)
            ) THEN re.exercise_id
          END) * 100.0 / NULLIF(COUNT(DISTINCT re.exercise_id), 0)
        ) AS compatibility_pct
      FROM routines r
      JOIN routine_exercises re ON r.id = re.routine_id
      JOIN exercises e ON re.exercise_id = e.id
      WHERE ${whereClause}
      GROUP BY r.id
      HAVING compatibility_pct >= 50
      ORDER BY compatibility_pct DESC, r.times_completed DESC
      LIMIT 10`
    queryParams = [names, names, ...params]
  }

  const [rows] = await pool.query<RowDataPacket[]>(sql, queryParams)
  return rows as Recommendation[]
}

// ─── Link custom equipment to exercises ──────────────────────
export const linkEquipmentToExercises = async (
  equipmentName: string,
  exerciseIds: number[],
  isOptional: boolean = false
): Promise<void> => {
  if (!exerciseIds.length) return
  const values = exerciseIds.map(id => [id, equipmentName, isOptional])
  await pool.query(
    'INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional) VALUES ?',
    [values]
  )
}

// ─── Unlink custom equipment from exercises ──────────────────
export const unlinkEquipmentFromExercises = async (
  equipmentName: string
): Promise<void> => {
  await pool.query(
    'DELETE FROM exercise_equipment WHERE equipment_name = ?',
    [equipmentName]
  )
}
