import { isAxiosError } from 'axios'

/** Forma de error del backend: `{ status, message }`. */
export interface ApiErrorBody {
  status: number
  message: string
}

/**
 * Mensaje a mostrar para un fallo de API. Si es un error del cliente (4xx) con
 * `message` en el cuerpo, lo devuelve (validación, conflicto...); en cualquier
 * otro caso (red, 5xx, desconocido) devuelve `fallback`.
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (!isAxiosError<Partial<ApiErrorBody>>(err)) return fallback
  const status = err.response?.status
  const message = err.response?.data?.message
  if (status && status >= 400 && status < 500 && typeof message === 'string' && message.trim()) {
    return message
  }
  return fallback
}
