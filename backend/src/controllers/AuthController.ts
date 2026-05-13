import { Request, Response, NextFunction } from 'express'
import { RowDataPacket } from 'mysql2'
import { pool } from '../config'

export const AuthController = {
  // GET /api/v1/auth/me — devuelve el perfil del usuario autenticado
  me: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT id, firebase_uid, username, email, sex, age, birth_date, fitness_level,
                experience, goals, primary_goal, weight_kg, height_cm,
                available_days, session_duration_min, injuries,
                onboarding_done, avatar_url, created_at
         FROM users WHERE id = ?`,
        [req.user!.id]
      )
      if (!rows.length) {
        res.status(404).json({ error: 'Usuario no encontrado' })
        return
      }
      const user = rows[0]
      // Parse JSON fields if they come as strings
      if (typeof user.goals === 'string') user.goals = JSON.parse(user.goals)
      if (typeof user.available_days === 'string') user.available_days = JSON.parse(user.available_days)
      if (typeof user.injuries === 'string') user.injuries = JSON.parse(user.injuries)

      res.json({ data: user })
    } catch (err) { next(err) }
  },

  // PATCH /api/v1/auth/me — actualiza perfil del usuario
  updateMe: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        username, sex, age, birth_date, fitness_level, experience,
        weight_kg, height_cm, goals, primary_goal,
        available_days, session_duration_min, injuries,
        onboarding_done, avatar_url,
      } = req.body

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
          username ?? null,
          sex ?? null,
          age ?? null,
          birth_date ?? null,
          fitness_level ?? null,
          experience ?? null,
          weight_kg ?? null,
          height_cm ?? null,
          goals ? JSON.stringify(goals) : null,
          primary_goal ?? null,
          available_days ? JSON.stringify(available_days) : null,
          session_duration_min ?? null,
          injuries ? JSON.stringify(injuries) : null,
          onboarding_done ?? null,
          avatar_url ?? null,
          req.user!.id,
        ]
      )

      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT id, username, email, sex, age, birth_date, fitness_level,
                experience, goals, primary_goal, weight_kg, height_cm,
                available_days, session_duration_min, injuries,
                onboarding_done, avatar_url
         FROM users WHERE id = ?`,
        [req.user!.id]
      )
      const user = rows[0]
      if (typeof user.goals === 'string') user.goals = JSON.parse(user.goals)
      if (typeof user.available_days === 'string') user.available_days = JSON.parse(user.available_days)
      if (typeof user.injuries === 'string') user.injuries = JSON.parse(user.injuries)

      res.json({ data: user })
    } catch (err) { next(err) }
  },
}
