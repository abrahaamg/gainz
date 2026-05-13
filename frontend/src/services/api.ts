import axios from 'axios'
import { auth } from '../config/firebase'
import { signOut } from 'firebase/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: añade Bearer token si hay usuario autenticado
api.interceptors.request.use(async config => {
  const user = auth.currentUser
  if (user) {
    // getIdToken(true) fuerza refresh si el token está a punto de expirar
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: manejar 401 (token expirado/inválido)
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const user = auth.currentUser
      if (user) {
        try {
          // Forzar refresh del token
          const newToken = await user.getIdToken(true)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        } catch {
          // Token completamente inválido — cerrar sesión
          await signOut(auth)
          window.location.href = '/login'
          return Promise.reject(error)
        }
      } else {
        // No hay usuario — redirigir a login
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
