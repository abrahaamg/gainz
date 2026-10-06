import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { auth } from '../config/firebase'
import { DEV_MODE } from '../config/authMode'
import { signOut } from 'firebase/auth'
import { useServerStatusStore } from '../store/useServerStatusStore'

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1',
  headers: { 'Content-Type': 'application/json' },
  // Margen para el arranque en frío del backend gratuito (Render)
  timeout: 65000,
})

// Aviso "despertando servidor": si hay peticiones que tardan más de 5 s se muestra el banner
const SLOW_REQUEST_MS = 5000
let pending = 0
let slowTimer: ReturnType<typeof setTimeout> | null = null

function requestStarted() {
  pending += 1
  if (!slowTimer) {
    slowTimer = setTimeout(() => useServerStatusStore.getState().setWaking(true), SLOW_REQUEST_MS)
  }
}

function requestFinished() {
  pending = Math.max(0, pending - 1)
  if (pending === 0) {
    if (slowTimer) clearTimeout(slowTimer)
    slowTimer = null
    useServerStatusStore.getState().setWaking(false)
  }
}

// Request interceptor: añade Bearer token si hay usuario autenticado
api.interceptors.request.use(async config => {
  requestStarted()
  try {
    const user = auth.currentUser
    if (user) {
      const token = await user.getIdToken()
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch (err) {
    requestFinished()
    throw err
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
  response => {
    requestFinished()
    return response
  },
  async (error: AxiosError) => {
    requestFinished()
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
