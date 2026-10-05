import { useCallback, useEffect, useRef, useState } from 'react'
import { routineService } from '../services/routineService'
import { sessionService } from '../services/sessionService'
import type { RoutineExercise } from '../types/routine'
import type { AddSetPayload, FinishSessionPayload } from '../types/session'

type Loaded = {
  key: string
  failed: boolean
  routineName: string
  exercises: RoutineExercise[]
  sessionId: number | null
}

/**
 * Carga la rutina, crea la sesión en el backend y expone las operaciones de
 * guardar serie / finalizar / abandonar. Seguro con StrictMode (la petición
 * duplicada se cancela) y al cambiar de rutina. Avisa antes de cerrar la
 * pestaña mientras la sesión sigue en curso.
 */
export function useWorkoutSession(routineId: number) {
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [ended, setEnded] = useState(false)
  const sessionIdRef = useRef<number | null>(null)

  const key = `${routineId}:${attempt}`

  useEffect(() => {
    let cancelled = false
    sessionIdRef.current = null

    const init = async () => {
      try {
        const routine = await routineService.getById(routineId)
        if (cancelled) return
        const { id } = await sessionService.create(routineId)
        if (cancelled) {
          // Efecto cancelado con la sesión ya creada: se cierra para no dejarla huérfana
          sessionService.finish(id, { status: 'abandoned', duration_seconds: 0 }).catch(() => {})
          return
        }
        sessionIdRef.current = id
        setLoaded({ key, failed: false, routineName: routine.name, exercises: routine.exercises ?? [], sessionId: id })
      } catch {
        if (!cancelled) setLoaded({ key, failed: true, routineName: '', exercises: [], sessionId: null })
      }
    }
    init()

    return () => { cancelled = true }
  }, [routineId, key])

  const current = loaded?.key === key ? loaded : null
  const status: 'loading' | 'ready' | 'error' = !current ? 'loading' : current.failed ? 'error' : 'ready'
  const sessionId = current?.sessionId ?? null
  const inProgress = sessionId !== null && !ended

  // Aviso del navegador al cerrar/recargar con la sesión en curso
  useEffect(() => {
    if (!inProgress) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [inProgress])

  const retry = useCallback(() => {
    setLoaded(null)
    setEnded(false)
    setAttempt(a => a + 1)
  }, [])

  const saveSet = useCallback(async (payload: AddSetPayload) => {
    if (sessionIdRef.current === null) throw new Error('session-not-ready')
    return sessionService.addSet(sessionIdRef.current, payload)
  }, [])

  const finish = useCallback(async (payload: FinishSessionPayload) => {
    if (sessionIdRef.current === null) throw new Error('session-not-ready')
    await sessionService.finish(sessionIdRef.current, payload)
    setEnded(true)
  }, [])

  return {
    status,
    retry,
    routineName: current?.routineName ?? '',
    exercises: current?.exercises ?? [],
    sessionId,
    inProgress,
    saveSet,
    finish,
  }
}
