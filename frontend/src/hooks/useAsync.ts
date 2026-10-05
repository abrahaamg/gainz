import { useCallback, useEffect, useMemo, useRef, useState, type DependencyList } from 'react'

interface Result<T> {
  token: object
  data?: T
  error?: unknown
}

export interface AsyncState<T> {
  /** Último dato recibido (se conserva mientras se recarga con nuevas deps). */
  data: T | undefined
  /** true desde que cambian las deps (o se llama a reload) hasta que llega la respuesta. */
  loading: boolean
  /** Error de la petición vigente; undefined si no hay. */
  error: unknown
  /** Repite la petición con las mismas deps. */
  reload: () => void
  /** Modifica el dato local (p. ej. tras borrar un elemento) sin volver a pedirlo. */
  setData: (updater: (prev: T | undefined) => T | undefined) => void
}

/**
 * Carga datos asíncronos con cancelación: si las deps cambian o el componente
 * se desmonta antes de que llegue la respuesta, esta se descarta (sin carreras).
 * `fn` se lee siempre en su última versión; solo `deps` dispara una nueva petición.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [reloadCount, setReloadCount] = useState(0)
  const [result, setResult] = useState<Result<T> | null>(null)
  const fnRef = useRef(fn)

  useEffect(() => {
    fnRef.current = fn
  })

  // Identidad nueva cada vez que cambian las deps o se pide recargar
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const token = useMemo(() => ({}), [...deps, reloadCount])

  useEffect(() => {
    let cancelled = false
    fnRef.current().then(
      data => { if (!cancelled) setResult({ token, data }) },
      error => { if (!cancelled) setResult(prev => ({ token, data: prev?.data, error })) },
    )
    return () => { cancelled = true }
  }, [token])

  const reload = useCallback(() => setReloadCount(c => c + 1), [])

  const setData = useCallback((updater: (prev: T | undefined) => T | undefined) => {
    setResult(prev => ({ token: prev?.token ?? token, data: updater(prev?.data), error: prev?.error }))
  }, [token])

  const settled = result?.token === token
  return {
    data: result?.data,
    loading: !settled,
    error: settled ? result?.error : undefined,
    reload,
    setData,
  }
}
