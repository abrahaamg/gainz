import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRestTimer } from './useRestTimer'

describe('useRestTimer', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('cuenta atrás y llama una sola vez a onFinish al terminar', () => {
    const onFinish = vi.fn()
    const { result } = renderHook(() => useRestTimer(onFinish))

    act(() => result.current.start(3))
    expect(result.current.running).toBe(true)
    expect(result.current.remaining).toBe(3)

    act(() => { vi.advanceTimersByTime(1500) })
    expect(result.current.remaining).toBe(2)
    expect(onFinish).not.toHaveBeenCalled()

    act(() => { vi.advanceTimersByTime(2000) })
    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(result.current.running).toBe(false)
    expect(result.current.remaining).toBe(0)
  })

  it('stop cancela sin llamar a onFinish', () => {
    const onFinish = vi.fn()
    const { result } = renderHook(() => useRestTimer(onFinish))
    act(() => result.current.start(5))
    act(() => result.current.stop())
    act(() => { vi.advanceTimersByTime(10000) })
    expect(onFinish).not.toHaveBeenCalled()
  })

  it('usa siempre la última versión de onFinish', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { result, rerender } = renderHook(({ cb }) => useRestTimer(cb), { initialProps: { cb: first } })
    act(() => result.current.start(2))
    rerender({ cb: second })
    act(() => { vi.advanceTimersByTime(3000) })
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
