import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest'
import { as, catalogExerciseId, createUser, pool, queryRows } from './helpers'

describe.skipIf(!inject('mysqlAvailable'))('Equipo', () => {
  let benchId: number

  beforeAll(async () => {
    benchId = await catalogExerciseId('Press de Banca')
  })

  afterAll(async () => {
    await pool.end()
  })

  it('el equipo personalizado de un usuario no cambia el catálogo de los demás', async () => {
    const alice = await createUser()
    const bob = await createUser()

    const bobBefore = await as(bob).get('/api/v1/equipment/exercises')
    const benchLinksBefore = await queryRows(
      'SELECT equipment_name FROM exercise_equipment WHERE exercise_id = ? ORDER BY equipment_name',
      [benchId]
    )

    const own = await as(alice).post('/api/v1/exercises').send({
      name: 'Press en máquina rara de Alice',
      category: 'strength',
      muscle_group: 'chest',
      requires_equipment: true,
      is_public: false,
    })
    expect(own.status).toBe(201)
    const ownExerciseId = own.body.data.id

    // Intenta vincular su equipo también a un ejercicio del catálogo
    const created = await as(alice).post('/api/v1/equipment').send({
      name: 'Máquina rara',
      exercise_ids: [ownExerciseId, benchId],
    })
    expect(created.status).toBe(201)

    const benchLinksAfter = await queryRows(
      'SELECT equipment_name FROM exercise_equipment WHERE exercise_id = ? ORDER BY equipment_name',
      [benchId]
    )
    expect(benchLinksAfter).toEqual(benchLinksBefore)

    const ownLinks = await queryRows(
      'SELECT equipment_name FROM exercise_equipment WHERE exercise_id = ?',
      [ownExerciseId]
    )
    expect(ownLinks.map((row) => row.equipment_name)).toEqual(['Máquina rara'])

    const bobAfter = await as(bob).get('/api/v1/equipment/exercises')
    expect(bobAfter.body.data).toEqual(bobBefore.body.data)
  })

  describe('equipo duplicado', () => {
    it('devuelve 409 si ya tiene un equipo con el mismo nombre', async () => {
      const user = await createUser()
      const body = { name: 'Mancuernas', catalog_name: 'Mancuernas', category: 'free_weights' }

      expect((await as(user).post('/api/v1/equipment').send(body)).status).toBe(201)
      const again = await as(user).post('/api/v1/equipment').send(body)

      expect(again.status).toBe(409)
      expect(again.body).toEqual({ status: 'error', message: 'Ya tienes este equipo' })
      const rows = await queryRows('SELECT id FROM equipment WHERE user_id = ?', [user])
      expect(rows).toHaveLength(1)
    })

    it('devuelve 409 si ya tiene otro equipo vinculado al mismo item del catálogo', async () => {
      const user = await createUser()
      await as(user).post('/api/v1/equipment').send({ name: 'Kettlebell', catalog_name: 'Kettlebell' })

      const res = await as(user).post('/api/v1/equipment').send({ name: 'Mi pesa rusa', catalog_name: 'Kettlebell' })

      expect(res.status).toBe(409)
    })

    it('devuelve 409 también al crear con ejercicios vinculados', async () => {
      const user = await createUser()
      await as(user).post('/api/v1/equipment').send({ name: 'Banco casero' })

      const res = await as(user).post('/api/v1/equipment').send({ name: 'Banco casero', exercise_ids: [benchId] })

      expect(res.status).toBe(409)
    })

    it('otro usuario sí puede tener el mismo equipo', async () => {
      const alice = await createUser()
      const bob = await createUser()
      const body = { name: 'Barra olímpica', catalog_name: 'Barra olímpica' }

      expect((await as(alice).post('/api/v1/equipment').send(body)).status).toBe(201)
      expect((await as(bob).post('/api/v1/equipment').send(body)).status).toBe(201)
    })
  })
})
