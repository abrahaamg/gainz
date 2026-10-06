import { useAsync } from './useAsync'
import { sessionService } from '../services/sessionService'
import type { LastPerformance } from '../types/session'

/**
 * Último rendimiento del ejercicio (con las series de la última sesión). Solo lee:
 * no escribe en ninguna casilla, así que nunca pisa lo que el usuario teclea.
 * Mientras carga (o al cambiar de ejercicio) devuelve null, nunca datos del ejercicio anterior; si falla, devuelve null (sin historial).
 */
export function useLastPerformance(exerciseId: number | undefined): LastPerformance | null {
  const { data, loading } = useAsync<LastPerformance | null>(
    () => (exerciseId === undefined
      ? Promise.resolve(null)
      : sessionService.getLastPerformance(exerciseId).catch(() => null)),
    [exerciseId],
  )
  return loading ? null : (data ?? null)
}
