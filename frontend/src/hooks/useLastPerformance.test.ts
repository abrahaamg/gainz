import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useLastPerformance } from './useLastPerformance'
import { sessionService } from '../services/sessionService'

vi.mock('../services/sessionService', () => ({
  sessionService: { getLastPerformance: vi.fn() },
}))

const getLast = vi.mocked(sessionService.getLastPerformance)

const perf = (reps: number) => ({
  weight_kg: 20, reps_done: reps, rpe: 7, plateau_detected: false,
  last_sets: [{ set_number: 1, reps_done: reps, weight_kg: 20, rpe: 7 }],
})

describe('useLastPerformance', () => {
  beforeEach(() => getLast.mockReset())

  it('devuelve las series de la última sesión', async () => {
    getLast.mockResolvedValue(perf(10))
    const { result } = renderHook(() => useLastPerformance(1))
    expect(result.current).toBeNull()
    await waitFor(() => expect(result.current?.last_sets?.[0].reps_done).toBe(10))
  })

  it('al cambiar de ejercicio no enseña datos del anterior mientras carga el nuevo', async () => {
    getLast.mockResolvedValueOnce(perf(10))
    const { result, rerender } = renderHook(({ id }) => useLastPerformance(id), { initialProps: { id: 1 } })
    await waitFor(() => expect(result.current).not.toBeNull())
    getLast.mockReturnValueOnce(new Promise(() => {}))
    rerender({ id: 2 })
    expect(result.current).toBeNull()
  })

  it('si la petición falla, no hay historial (null) y no revienta', async () => {
    // Función plana (no vi.fn): el registro de resultados de vi.fn deja la promesa rechazada sin gestionar
    const service = sessionService as { getLastPerformance: unknown }
    const original = service.getLastPerformance
    let calls = 0
    service.getLastPerformance = () => { calls++; return Promise.reject(new Error('x')) }
    try {
      const { result } = renderHook(() => useLastPerformance(3))
      await waitFor(() => expect(calls).toBeGreaterThan(0))
      expect(result.current).toBeNull()
    } finally {
      service.getLastPerformance = original
    }
  })

  it('sin ejercicio no pide nada', () => {
    const { result } = renderHook(() => useLastPerformance(undefined))
    expect(result.current).toBeNull()
    expect(getLast).not.toHaveBeenCalled()
  })
})
