import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { pool } from '../config'

export interface UpdateUserProfileDTO {
  username?: string | null
  sex?: string | null
  age?: number | null
  birth_date?: string | null
  fitness_level?: string | null
  experience?: string | null
  weight_kg?: number | null
  height_cm?: number | null
  goals?: string[] | null
  primary_goal?: string | null
  available_days?: string[] | null
  session_duration_min?: number | null
  injuries?: string[] | null
  onboarding_done?: boolean
  avatar_url?: string | null
}

// Los campos JSON pueden llegar como string según la versión de MySQL
const parseJsonFields = (user: RowDataPacket): RowDataPacket => {
  if (typeof user.goals === 'string') user.goals = JSON.parse(user.goals)
  if (typeof user.available_days === 'string') user.available_days = JSON.parse(user.available_days)
  if (typeof user.injuries === 'string') user.injuries = JSON.parse(user.injuries)
  return user
}

// ─── Perfil ───────────────────────────────────────────────────
export const findUserProfile = async (id: number): Promise<RowDataPacket | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, firebase_uid, username, email, sex, age, birth_date, fitness_level,
            experience, goals, primary_goal, weight_kg, height_cm,
            available_days, session_duration_min, injuries,
            onboarding_done, avatar_url, created_at
     FROM users WHERE id = ?`,
    [id]
  )
  return rows.length ? parseJsonFields(rows[0]) : null
}

/** Actualiza solo los campos que llegan y devuelve el perfil resultante */
export const updateUserProfile = async (id: number, data: UpdateUserProfileDTO): Promise<RowDataPacket> => {
  await pool.query(
    `UPDATE users SET
       username            = COALESCE(?, username),
       sex                 = COALESCE(?, sex),
       age                 = COALESCE(?, age),
       birth_date          = COALESCE(?, birth_date),
       fitness_level       = COALESCE(?, fitness_level),
       experience          = COALESCE(?, experience),
       weight_kg           = COALESCE(?, weight_kg),
       height_cm           = COALESCE(?, height_cm),
       goals               = COALESCE(?, goals),
       primary_goal        = COALESCE(?, primary_goal),
       available_days      = COALESCE(?, available_days),
       session_duration_min = COALESCE(?, session_duration_min),
       injuries            = COALESCE(?, injuries),
       onboarding_done     = COALESCE(?, onboarding_done),
       avatar_url          = COALESCE(?, avatar_url),
       updated_at          = NOW()
     WHERE id = ?`,
    [
      data.username ?? null,
      data.sex ?? null,
      data.age ?? null,
      data.birth_date ?? null,
      data.fitness_level ?? null,
      data.experience ?? null,
      data.weight_kg ?? null,
      data.height_cm ?? null,
      data.goals ? JSON.stringify(data.goals) : null,
      data.primary_goal ?? null,
      data.available_days ? JSON.stringify(data.available_days) : null,
      data.session_duration_min ?? null,
      data.injuries ? JSON.stringify(data.injuries) : null,
      data.onboarding_done ?? null,
      data.avatar_url ?? null,
      id,
    ]
  )

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, username, email, sex, age, birth_date, fitness_level,
            experience, goals, primary_goal, weight_kg, height_cm,
            available_days, session_duration_min, injuries,
            onboarding_done, avatar_url
     FROM users WHERE id = ?`,
    [id]
  )
  return parseJsonFields(rows[0])
}

/** Datos que necesita el generador de rutinas */
export const findUserTrainingProfile = async (id: number): Promise<RowDataPacket | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, sex, age, fitness_level, experience, primary_goal, goals,
            weight_kg, available_days, session_duration_min, injuries
     FROM users WHERE id = ?`,
    [id]
  )
  return rows.length ? parseJsonFields(rows[0]) : null
}

// ─── Sincronización con Firebase ──────────────────────────────
export const findUserByFirebaseUid = async (
  uid: string
): Promise<{ id: number; email: string | null } | undefined> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, email FROM users WHERE firebase_uid = ?',
    [uid]
  )
  return rows[0] as { id: number; email: string | null } | undefined
}

export const updateUserEmail = async (id: number, email: string): Promise<void> => {
  await pool.query<ResultSetHeader>(
    'UPDATE users SET email = ?, updated_at = NOW() WHERE id = ?',
    [email, id]
  )
}

export const isUsernameTaken = async (username: string): Promise<boolean> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT 1 FROM users WHERE username = ? LIMIT 1',
    [username]
  )
  return rows.length > 0
}

/** Crea el usuario y su fila de rachas. Devuelve el id nuevo. */
export const createFirebaseUser = async (
  uid: string,
  email: string | null,
  username: string
): Promise<number> => {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO users (firebase_uid, email, username) VALUES (?, ?, ?)',
    [uid, email, username]
  )
  await pool.query<ResultSetHeader>(
    `INSERT IGNORE INTO streaks (user_id, current_streak, longest_streak, total_workouts, total_minutes)
     VALUES (?, 0, 0, 0, 0)`,
    [result.insertId]
  )
  return result.insertId
}
