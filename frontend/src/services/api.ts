import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { auth } from '../config/firebase'
import { DEV_MODE } from '../config/authMode'
import { signOut } from 'firebase/auth'

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: añade Bearer token si hay usuario autenticado
api.interceptors.request.use(async config => {
  const user = auth.currentUser
  if (user) {
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Una única promesa de refresco compartida entre todos los 401 simultáneos
let refreshPromise: Promise<string> | null = null

function refreshToken(): Promise<string> {
  const user = auth.currentUser
  if (!user) return Promise.reject(new Error('no-user'))
  if (!refreshPromise) {
    refreshPromise = user.getIdToken(true).finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

function redirectToLogin() {
  if (window.location.pathname !== '/login') window.location.href = '/login'
}

// Response interceptor: manejar 401 (token expirado/inválido)
api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined
    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error)
    }

    // En DEV sin Firebase no hay sesión que refrescar ni login al que ir: evita el bucle de redirecciones
    if (DEV_MODE) return Promise.reject(error)

    originalRequest._retry = true

    if (!auth.currentUser) {
      redirectToLogin()
      return Promise.reject(error)
    }

    try {
      const newToken = await refreshToken()
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return api(originalRequest)
    } catch {
      // Token completamente inválido — cerrar sesión
      try { await signOut(auth) } catch { /* ya cerrada */ }
      redirectToLogin()
      return Promise.reject(error)
    }
  }
)

export default api
