import { describe, it, expect } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useAsync } from './useAsync'

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

describe('useAsync', () => {
  it('carga datos y deja loading en false', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.resolve(42), []))
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBe(42)
  })

  it('expone el error y permite reintentar', async () => {
    let calls = 0
    const { result } = renderHook(() => useAsync(() => {
      calls++
      return calls === 1 ? Promise.reject(new Error('x')) : Promise.resolve('ok')
    }, []))
    await waitFor(() => expect(result.current.error).toBeTruthy())
    act(() => result.current.reload())
    await waitFor(() => expect(result.current.data).toBe('ok'))
    expect(result.current.error).toBeUndefined()
  })

  it('descarta la respuesta vieja si cambian las deps (sin carreras)', async () => {
    const slow = deferred<string>()
    const fast = deferred<string>()
    const { result, rerender } = renderHook(({ q }) => useAsync(() => (q === 'a' ? slow.promise : fast.promise), [q]), {
      initialProps: { q: 'a' },
    })
    rerender({ q: 'b' })
    await act(async () => { fast.resolve('B') })
    await waitFor(() => expect(result.current.data).toBe('B'))
    await act(async () => { slow.resolve('A') })
    expect(result.current.data).toBe('B')
    expect(result.current.loading).toBe(false)
  })
})
