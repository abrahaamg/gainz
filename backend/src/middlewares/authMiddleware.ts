import { Request, Response, NextFunction } from 'express'
import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { pool } from '../config'
import { verifyIdToken } from '../services/firebaseService'

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // DEV fallback — si Firebase no está configurado, usar usuario fijo
  if (!process.env.FIREBASE_PROJECT_ID) {
    req.user = { id: 1, email: 'dev@test.com' }
    return next()
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token no proporcionado' })
    return
  }

  try {
    const token   = authHeader.split(' ')[1]
    const decoded = await verifyIdToken(token)

    // Upsert user en MySQL (crea si no existe, actualiza email si cambió)
    const username = (decoded.email?.split('@')[0] ?? decoded.uid).slice(0, 100)
    await pool.query<ResultSetHeader>(
      `INSERT INTO users (firebase_uid, email, username)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE email = VALUES(email), updated_at = NOW()`,
      [decoded.uid, decoded.email ?? '', username]
    )

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, email FROM users WHERE firebase_uid = ?',
      [decoded.uid]
    )

    // Asegurar que el usuario tiene fila en streaks (crea si no existe)
    await pool.query<ResultSetHeader>(
      `INSERT IGNORE INTO streaks (user_id, current_streak, longest_streak, total_workouts, total_minutes)
       VALUES (?, 0, 0, 0, 0)`,
      [rows[0].id]
    )

    req.user = { id: rows[0].id, email: rows[0].email }
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' })
  }
}
