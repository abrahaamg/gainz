import { Request, Response, NextFunction } from 'express'
import { RowDataPacket } from 'mysql2'
import { pool } from '../config'

export const AuthController = {
  // GET /api/v1/auth/me — devuelve el perfil del usuario autenticado
  me: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT id, firebase_uid, username, email, fitness_level,
                goals, weight_kg, avatar_url, created_at
         FROM users WHERE id = ?`,
        [req.user.id]
      )
      if (!rows.length) {
        res.status(404).json({ error: 'Usuario no encontrado' })
        return
      }
      res.json({ data: rows[0] })
    } catch (err) { next(err) }
  },

  // PATCH /api/v1/auth/me — actualiza perfil del usuario
  updateMe: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, fitness_level, weight_kg, avatar_url, goals } = req.body
      await pool.query(
        `UPDATE users
         SET username = COALESCE(?, username),
             fitness_level = COALESCE(?, fitness_level),
             weight_kg = COALESCE(?, weight_kg),
             avatar_url = COALESCE(?, avatar_url),
             goals = COALESCE(?, goals),
             updated_at = NOW()
         WHERE id = ?`,
        [
          username ?? null,
          fitness_level ?? null,
          weight_kg ?? null,
          avatar_url ?? null,
          goals ? JSON.stringify(goals) : null,
          req.user.id,
        ]
      )
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT id, username, email, fitness_level, goals, weight_kg, avatar_url FROM users WHERE id = ?',
        [req.user.id]
      )
      res.json({ data: rows[0] })
    } catch (err) { next(err) }
  },
}
