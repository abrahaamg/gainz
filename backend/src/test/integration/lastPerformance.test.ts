import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest'
import { as, catalogExerciseId, createUser, officialRoutineId, pool } from './helpers'

describe.skipIf(!inject('mysqlAvailable'))('last-performance: series de la última sesión completada', () => {
  let routineId: number
  let benchId: number

  const startSession = async (userId: number): Promise<number> => {
    const res = await as(userId).post('/api/v1/sessions').send({ routine_id: routineId })
    expect(res.status).toBe(201)
    return res.body.data.id
  }

  const addSet = async (
    userId: number, sessionId: number, setNumber: number, repsDone: number, weightKg: number, rpe?: number
  ) => {
    const res = await as(userId)
      .post(`/api/v1/sessions/${sessionId}/exercises`)
      .send({ exercise_id: benchId, set_number: setNumber, reps_done: repsDone, weight_kg: weightKg, rpe })
    expect(res.status).toBe(201)
  }

  const finish = async (userId: number, sessionId: number) => {
    const res = await as(userId)
      .put(`/api/v1/sessions/${sessionId}`)
      .send({ status: 'completed', duration_seconds: 600 })
    expect(res.status).toBe(200)
  }

  const lastPerformance = (userId: number) =>
    as(userId).get(`/api/v1/sessions/exercises/${benchId}/last-performance`)

  beforeAll(async () => {
    routineId = await officialRoutineId('Fuerza Básica con Barra')
    benchId = await catalogExerciseId('Press de Banca')
  })

  afterAll(async () => {
    await pool.end()
  })

  it('sin historial devuelve last_sets vacío', async () => {
    const user = await createUser()
    const res = await lastPerformance(user)

    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ weight_kg: null, reps_done: null, rpe: null, last_sets: [] })
  })

  it('devuelve las series de la sesión completada más reciente, sin mezclar otro usuario ni la sesión en curso', async () => {
    const user = await createUser()
    const other = await createUser()

    // Sesión antigua
    const older = await startSession(user)
    await addSet(user, older, 1, 5, 60)
    await addSet(user, older, 2, 5, 60)
    await finish(user, older)
    await pool.query(
      "UPDATE sessions SET started_at = '2024-01-01 10:00:00', finished_at = '2024-01-01 11:00:00' WHERE id = ?",
      [older]
    )

    // Sesión más reciente, con la serie 2 repetida: cuenta la última
    const latest = await startSession(user)
    await addSet(user, latest, 1, 10, 20, 7)
    await addSet(user, latest, 2, 7, 20)
    await addSet(user, latest, 3, 8, 20)
    await addSet(user, latest, 2, 9, 22.5, 8)
    await finish(user, latest)

    // Otro usuario con una sesión completada aún más nueva
    const otherSession = await startSession(other)
    await addSet(other, otherSession, 1, 1, 150)
    await finish(other, otherSession)

    // Sesión en curso del propio usuario: no cuenta
    const inProgress = await startSession(user)
    await addSet(user, inProgress, 1, 3, 100)

    const res = await lastPerformance(user)

    expect(res.status).toBe(200)
    expect(res.body.data.last_sets).toEqual([
      { set_number: 1, reps_done: 10, weight_kg: 20, rpe: 7 },
      { set_number: 2, reps_done: 9, weight_kg: 22.5, rpe: 8 },
      { set_number: 3, reps_done: 8, weight_kg: 20, rpe: null },
    ])
    // Los campos de siempre siguen ahí
    expect(res.body.data).toHaveProperty('weight_kg')
    expect(res.body.data).toHaveProperty('reps_done')
    expect(res.body.data).toHaveProperty('rpe')
    expect(res.body.data.plateau_detected).toBe(false)

    const otherRes = await lastPerformance(other)
    expect(otherRes.body.data.last_sets).toEqual([
      { set_number: 1, reps_done: 1, weight_kg: 150, rpe: null },
    ])
  })
})
