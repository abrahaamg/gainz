import { Request, Response } from 'express'
import { findUserProfile, updateUserProfile } from '../queries/user.queries'
import { asyncHandler } from '../utils/functions'
import { NotFoundError } from '../utils/customErrors'

export const AuthController = {
  // GET /api/v1/auth/me — devuelve el perfil del usuario autenticado
  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await findUserProfile(req.user!.id)
    if (!user) throw new NotFoundError('Usuario no encontrado')
    res.json({ data: user })
  }),

  // PATCH /api/v1/auth/me — actualiza perfil del usuario
  updateMe: asyncHandler(async (req: Request, res: Response) => {
    const user = await updateUserProfile(req.user!.id, req.body)
    res.json({ data: user })
  }),
}
