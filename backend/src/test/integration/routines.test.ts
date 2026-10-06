import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest'
import { as, catalogExerciseId, createUser, officialRoutineId, pool, queryRows } from './helpers'

const PLAN = [
  { reps: 9, weight_kg: 62 },
  { reps: 8, weight_kg: 62 },
  { reps: 8, weight_kg: 57 },
  { reps: 9, weight_kg: 55 },
  { reps: 8, weight_kg: 50 },
]

describe.skipIf(!inject('mysqlAvailable'))('Plan por serie en ejercicios de rutina', () => {
  let user: number
  let benchId: number
  let squatId: number

  beforeAll(async () => {
    user = await createUser()
    benchId = await catalogExerciseId('Press de Banca')
    squatId = await catalogExerciseId('Sentadilla con Barra')
  })

  afterAll(async () => {
    await pool.end()
  })

  const createWithPlan = () =>
    as(user).post('/api/v1/routines').send({
      name: 'Rutina con plan por serie',
      exercises: [
        // sets/reps/weight_suggestion sueltos se ignoran si hay set_plan
        { exercise_id: benchId, order_index: 0, sets: 3, reps: 12, weight_suggestion: 40, set_plan: PLAN },
        { exercise_id: squatId, order_index: 1, sets: 4, reps: 6, weight_suggestion: 80 },
      ],
    })

  it('crea la rutina con set_plan y deriva sets, reps y weight_suggestion', async () => {
    const res = await createWithPlan()
    expect(res.status).toBe(201)

    const [bench, squat] = res.body.data.exercises
    expect(bench.set_plan).toEqual(PLAN)
    expect(bench.sets).toBe(5)
    expect(bench.reps).toBe(9)
    expect(Number(bench.weight_suggestion)).toBe(62)

    expect(squat.set_plan).toBeNull()
    expect(squat.sets).toBe(4)
    expect(squat.reps).toBe(6)
    expect(Number(squat.weight_suggestion)).toBe(80)
  })

  it('GET /routines/:id devuelve set_plan parseado', async () => {
    const created = await createWithPlan()
    const res = await as(user).get(`/api/v1/routines/${created.body.data.id}`)

    expect(res.status).toBe(200)
    expect(res.body.data.exercises[0].set_plan).toEqual(PLAN)
    expect(res.body.data.exercises[1].set_plan).toBeNull()
  })

  it('actualiza el plan y lo borra mandando set_plan: null', async () => {
    const created = await createWithPlan()
    const id = created.body.data.id

    const updated = await as(user).put(`/api/v1/routines/${id}`).send({
      exercises: [{
        exercise_id: benchId,
        order_index: 0,
        set_plan: [{ reps: 10, weight_kg: 20 }, { reps: 9, weight_kg: 20 }, { reps: 8, weight_kg: null }],
      }],
    })
    expect(updated.status).toBe(200)
    const [bench] = updated.body.data.exercises
    expect(bench.set_plan).toEqual([{ reps: 10, weight_kg: 20 }, { reps: 9, weight_kg: 20 }, { reps: 8, weight_kg: null }])
    expect(bench.sets).toBe(3)
    expect(bench.reps).toBe(10)
    expect(Number(bench.weight_suggestion)).toBe(20)

    const cleared = await as(user).put(`/api/v1/routines/${id}`).send({
      exercises: [{ exercise_id: benchId, order_index: 0, sets: 4, reps: 6, weight_suggestion: 50, set_plan: null }],
    })
    expect(cleared.status).toBe(200)
    const [plain] = cleared.body.data.exercises
    expect(plain.set_plan).toBeNull()
    expect(plain.sets).toBe(4)
    expect(plain.reps).toBe(6)

    const [row] = await queryRows('SELECT set_plan FROM routine_exercises WHERE routine_id = ?', [id])
    expect(row.set_plan).toBeNull()
  })

  it('una rutina antigua sin plan devuelve set_plan null', async () => {
    const routineId = await officialRoutineId('Fuerza Básica con Barra')
    const res = await as(user).get(`/api/v1/routines/${routineId}`)

    expect(res.status).toBe(200)
    expect(res.body.data.exercises.length).toBeGreaterThan(0)
    for (const ex of res.body.data.exercises) expect(ex.set_plan).toBeNull()
  })

  it.each([
    ['vacío', []],
    ['reps 0', [{ reps: 0, weight_kg: 20 }]],
    ['peso negativo', [{ reps: 8, weight_kg: -5 }]],
    ['más de 20 series', Array.from({ length: 21 }, () => ({ reps: 5, weight_kg: 10 }))],
  ])('responde 400 con set_plan inválido (%s) y no crea nada', async (_label, setPlan) => {
    const name = `Rutina inválida ${_label}`
    const res = await as(user).post('/api/v1/routines').send({
      name,
      exercises: [{ exercise_id: benchId, order_index: 0, set_plan: setPlan }],
    })

    expect(res.status).toBe(400)
    const rows = await queryRows('SELECT id FROM routines WHERE user_id = ? AND name = ?', [user, name])
    expect(rows).toHaveLength(0)
  })
})
