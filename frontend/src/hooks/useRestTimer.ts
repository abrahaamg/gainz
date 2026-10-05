import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Cuenta atrás basada en el instante de fin (timestamp), no en restar 1 por tick:
 * no se desfasa si la pestaña se ralentiza. Un único efecto hace el tick y
 * `onFinish` se lee siempre en su última versión (sin closures viejas).
 * Sirve para el descanso y para la cuenta atrás de ejercicios por tiempo.
 */
export function useRestTimer(onFinish: () => void) {
  const [endAt, setEndAt] = useState<number | null>(null)
  const [remaining, setRemaining] = useState(0)
  const onFinishRef = useRef(onFinish)

  useEffect(() => {
    onFinishRef.current = onFinish
  })

  useEffect(() => {
    if (endAt === null) return
    let done = false
    const id = setInterval(() => {
      if (done) return
      const left = Math.ceil((endAt - Date.now()) / 1000)
      if (left <= 0) {
        done = true
        setRemaining(0)
        setEndAt(null)
        onFinishRef.current()
        return
      }
      setRemaining(left)
    }, 250)
    return () => clearInterval(id)
  }, [endAt])

  const start = useCallback((seconds: number) => {
    setRemaining(seconds)
    setEndAt(Date.now() + seconds * 1000)
  }, [])

  const stop = useCallback(() => {
    setEndAt(null)
    setRemaining(0)
  }, [])

  return { remaining, running: endAt !== null, start, stop }
}

/** Cronómetro en segundos transcurridos; se pausa cuando `running` es false. */
export function useStopwatch(running: boolean) {
  const [elapsed, setElapsed] = useState(0)
  const elapsedRef = useRef(0)

  useEffect(() => {
    if (!running) return
    const base = Date.now() - elapsedRef.current * 1000
    const id = setInterval(() => {
      const secs = Math.floor((Date.now() - base) / 1000)
      elapsedRef.current = secs
      setElapsed(secs)
    }, 500)
    return () => clearInterval(id)
  }, [running])

  return elapsed
}
