import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Módulo 7: añadir interceptor con Bearer token de Firebase aquí

export default api
