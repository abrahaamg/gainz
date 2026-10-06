import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest'
import { as, catalogExerciseId, createUser, officialRoutineId, pool, queryRows } from './helpers'

describe.skipIf(!inject('mysqlAvailable'))('Sesiones: racha, récords, cierre y validación', () => {
  let routineId: number
  let benchId: number

  const startSession = async (userId: number): Promise<number> => {
    const res = await as(userId).post('/api/v1/sessions').send({ routine_id: routineId })
    expect(res.status).toBe(201)
    return res.body.data.id
  }

  const finish = (userId: number, sessionId: number) =>
    as(userId).put(`/api/v1/sessions/${sessionId}`).send({ status: 'completed', duration_seconds: 600 })

  const addSet = (userId: number, sessionId: number, setNumber: number, weightKg: number) =>
    as(userId)
      .post(`/api/v1/sessions/${sessionId}/exercises`)
      .send({ exercise_id: benchId, set_number: setNumber, reps_done: 5, weight_kg: weightKg })

  beforeAll(async () => {
    routineId = await officialRoutineId('Fuerza Básica con Barra')
    benchId = await catalogExerciseId('Press de Banca')
  })

  afterAll(async () => {
    await pool.end()
  })

  it('dos sesiones completadas el mismo día no suman racha ni entrenos', async () => {
    const user = await createUser()

    expect((await finish(user, await startSession(user))).status).toBe(200)
    expect((await finish(user, await startSession(user))).status).toBe(200)

    const [streak] = await queryRows(
      'SELECT current_streak, longest_streak, total_workouts, total_minutes FROM streaks WHERE user_id = ?',
      [user]
    )
    expect(streak).toMatchObject({ current_streak: 1, longest_streak: 1, total_workouts: 1, total_minutes: 20 })
  })

  it('new_pr solo es true si la serie mejora el récord, y entonces actualiza achieved_at', async () => {
    const user = await createUser()
    const sessionId = await startSession(user)

    const first = await addSet(user, sessionId, 1, 60)
    expect(first.status).toBe(201)
    expect(first.body.data.new_pr).toBe(true)

    // Fecha antigua conocida para ver si se toca o no
    await pool.query(
      `UPDATE personal_records SET achieved_at = '2020-01-01 00:00:00'
       WHERE user_id = ? AND exercise_id = ? AND record_type = 'max_weight'`,
      [user, benchId]
    )

    const worse = await addSet(user, sessionId, 2, 50)
    expect(worse.body.data.new_pr).toBe(false)
    let [record] = await queryRows(
      `SELECT value, achieved_at FROM personal_records
       WHERE user_id = ? AND exercise_id = ? AND record_type = 'max_weight'`,
      [user, benchId]
    )
    expect(Number(record.value)).toBe(60)
    expect(new Date(record.achieved_at).getFullYear()).toBe(2020)

    const equal = await addSet(user, sessionId, 3, 60)
    expect(equal.body.data.new_pr).toBe(false)

    const better = await addSet(user, sessionId, 4, 70)
    expect(better.body.data.new_pr).toBe(true)
    ;[record] = await queryRows(
      `SELECT value, achieved_at, session_id FROM personal_records
       WHERE user_id = ? AND exercise_id = ? AND record_type = 'max_weight'`,
      [user, benchId]
    )
    expect(Number(record.value)).toBe(70)
    expect(new Date(record.achieved_at).getFullYear()).toBeGreaterThan(2020)
    expect(record.session_id).toBe(sessionId)
  })

  it('finalizar dos veces la misma sesión devuelve 400 la segunda', async () => {
    const user = await createUser()
    const sessionId = await startSession(user)

    expect((await finish(user, sessionId)).status).toBe(200)
    const second = await finish(user, sessionId)

    expect(second.status).toBe(400)
    expect(second.body.status).toBe('error')
    const [streak] = await queryRows('SELECT total_workouts FROM streaks WHERE user_id = ?', [user])
    expect(streak.total_workouts).toBe(1)
  })

  it('no admite series en una sesión ya finalizada', async () => {
    const user = await createUser()
    const sessionId = await startSession(user)
    await finish(user, sessionId)

    expect((await addSet(user, sessionId, 1, 60)).status).toBe(404)
  })

  describe('validación zod', () => {
    it('rechaza routine_id no numérico', async () => {
      const user = await createUser()
      const res = await as(user).post('/api/v1/sessions').send({ routine_id: 'abc' })
      expect(res.status).toBe(400)
      expect(res.body.message).toContain('body.routine_id')
    })

    it('rechaza una serie sin set_number', async () => {
      const user = await createUser()
      const sessionId = await startSession(user)
      const res = await as(user)
        .post(`/api/v1/sessions/${sessionId}/exercises`)
        .send({ exercise_id: benchId, reps_done: 5 })
      expect(res.status).toBe(400)
      expect(res.body.message).toContain('body.set_number')
    })

    it('rechaza un estado de cierre desconocido', async () => {
      const user = await createUser()
      const sessionId = await startSession(user)
      const res = await as(user)
        .put(`/api/v1/sessions/${sessionId}`)
        .send({ status: 'paused', duration_seconds: 60 })
      expect(res.status).toBe(400)
    })

    it('rechaza un id de ruta no numérico', async () => {
      const user = await createUser()
      const res = await as(user).get('/api/v1/sessions/abc')
      expect(res.status).toBe(400)
      expect(res.body.message).toContain('params.id')
    })
  })
})
