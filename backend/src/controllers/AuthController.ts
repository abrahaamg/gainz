import { Request, Response } from 'express'
import { findUserProfile, updateUserProfile } from '../queries/user.queries'
import { asyncHandler } from '../utils/functions'

export const AuthController = {
  // GET /api/v1/auth/me — devuelve el perfil del usuario autenticado
  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await findUserProfile(req.user!.id)
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' })
      return
    }
    res.json({ data: user })
  }),

  // PATCH /api/v1/auth/me — actualiza perfil del usuario
  updateMe: asyncHandler(async (req: Request, res: Response) => {
    const user = await updateUserProfile(req.user!.id, req.body)
    res.json({ data: user })
  }),
}
