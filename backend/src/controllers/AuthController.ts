import { Request, Response, NextFunction } from 'express'
import { findUserProfile, updateUserProfile } from '../queries/user.queries'

export const AuthController = {
  // GET /api/v1/auth/me — devuelve el perfil del usuario autenticado
  me: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await findUserProfile(req.user!.id)
      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' })
        return
      }
      res.json({ data: user })
    } catch (err) { next(err) }
  },

  // PATCH /api/v1/auth/me — actualiza perfil del usuario
  updateMe: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await updateUserProfile(req.user!.id, req.body)
      res.json({ data: user })
    } catch (err) { next(err) }
  },
}
