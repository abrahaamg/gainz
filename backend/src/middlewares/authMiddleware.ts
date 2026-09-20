import { Request, Response, NextFunction } from 'express'
import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { pool } from '../config'
import { verifyIdToken } from '../services/firebaseService'

/**
 * Atajo de desarrollo: sin Firebase configurado se trabaja con un usuario fijo
 * para poder probar la API en local sin montar autenticación real.
 *
 * Solo se activa fuera de producción. En producción, la ausencia de
 * credenciales NO puede dejar pasar peticiones: se rechaza la petición. Antes
 * bastaba con que faltara FIREBASE_PROJECT_ID en el despliegue para que toda la
 * API quedara abierta como usuario 1 sin ningún aviso.
 */
const isProduction = process.env.NODE_ENV === 'production'
const firebaseConfigured = Boolean(process.env.FIREBASE_PROJECT_ID)
const devAuthBypass = !isProduction && !firebaseConfigured

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (devAuthBypass) {
    req.user = { id: 1, email: 'dev@test.com' }
    return next()
  }

  if (!firebaseConfigured) {
    console.error(
      '[auth] FIREBASE_PROJECT_ID no está definido en producción: se rechazan todas las peticiones.'
    )
    res.status(500).json({ error: 'Autenticación no configurada en el servidor' })
    return
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
