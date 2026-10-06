import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest'
import { as, catalogExerciseId, createUser, officialRoutineId, pool, queryRows } from './helpers'

describe.skipIf(!inject('mysqlAvailable'))('Un usuario no puede tocar lo privado de otro', () => {
  let alice: number
  let bob: number
  let benchId: number

  beforeAll(async () => {
    alice = await createUser()
    bob = await createUser()
    benchId = await catalogExerciseId('Press de Banca')
  })

  afterAll(async () => {
    await pool.end()
  })

  it('no puede añadir series a la sesión de otro usuario', async () => {
    const routineId = await officialRoutineId('Fuerza Básica con Barra')
    const created = await as(bob).post('/api/v1/sessions').send({ routine_id: routineId })
    expect(created.status).toBe(201)
    const sessionId = created.body.data.id

    const res = await as(alice)
      .post(`/api/v1/sessions/${sessionId}/exercises`)
      .send({ exercise_id: benchId, set_number: 1, reps_done: 5, weight_kg: 60 })

    expect(res.status).toBe(404)
    const sets = await queryRows('SELECT id FROM session_exercises WHERE session_id = ?', [sessionId])
    expect(sets).toHaveLength(0)
  })

  it('no puede modificar una rutina oficial', async () => {
    const routineId = await officialRoutineId('Full Body Principiante')

    const res = await as(alice).put(`/api/v1/routines/${routineId}`).send({ name: 'Hackeada' })

    expect(res.status).toBe(403)
    const [routine] = await queryRows('SELECT name FROM routines WHERE id = ?', [routineId])
    expect(routine.name).toBe('Full Body Principiante')
  })

  it('no puede empezar una sesión con la rutina privada de otro usuario', async () => {
    const created = await as(bob).post('/api/v1/routines').send({
      name: 'Rutina privada de Bob',
      is_public: false,
      exercises: [{ exercise_id: benchId, order_index: 0 }],
    })
    expect(created.status).toBe(201)
    const privateRoutineId = created.body.data.id

    const res = await as(alice).post('/api/v1/sessions').send({ routine_id: privateRoutineId })

    expect(res.status).toBe(404)
    const sessions = await queryRows('SELECT id FROM sessions WHERE user_id = ?', [alice])
    expect(sessions).toHaveLength(0)
  })

  it('sí puede empezar una sesión con una rutina oficial pública', async () => {
    const routineId = await officialRoutineId('HIIT Express 30min')
    const res = await as(alice).post('/api/v1/sessions').send({ routine_id: routineId })
    expect(res.status).toBe(201)
  })

  it('no puede ver, editar ni borrar el ejercicio privado de otro usuario', async () => {
    const created = await as(bob).post('/api/v1/exercises').send({
      name: 'Ejercicio secreto de Bob',
      category: 'strength',
      muscle_group: 'chest',
      is_public: false,
    })
    expect(created.status).toBe(201)
    const exerciseId = created.body.data.id

    expect((await as(alice).get(`/api/v1/exercises/${exerciseId}`)).status).toBe(404)
    expect((await as(alice).put(`/api/v1/exercises/${exerciseId}`).send({ name: 'Mío' })).status).toBe(404)
    expect((await as(alice).delete(`/api/v1/exercises/${exerciseId}`)).status).toBe(404)

    const [exercise] = await queryRows('SELECT name FROM exercises WHERE id = ?', [exerciseId])
    expect(exercise.name).toBe('Ejercicio secreto de Bob')
  })

  it('no puede editar un ejercicio del catálogo', async () => {
    const res = await as(alice).put(`/api/v1/exercises/${benchId}`).send({ name: 'Press mío' })
    expect(res.status).toBe(403)
  })
})
