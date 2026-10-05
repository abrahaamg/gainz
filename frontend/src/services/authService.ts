import api from './api'
import type { MysqlUser } from '../store/useAuthStore'

export type ProfileUpdate = Partial<Omit<MysqlUser, 'id' | 'email' | 'avatar_url' | 'username'>> & { username?: string | null }

export const authService = {
  /** Perfil del usuario autenticado (GET /auth/). */
  async getProfile(): Promise<MysqlUser> {
    const res = await api.get<{ data: MysqlUser }>('/auth/')
    return res.data.data
  },

  /** Actualiza el perfil y devuelve el usuario guardado (PATCH /auth/me). */
  async updateProfile(payload: ProfileUpdate): Promise<MysqlUser> {
    const res = await api.patch<{ data: MysqlUser }>('/auth/me', payload)
    return res.data.data
  },
}
