import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest'
import { as, createUser, officialRoutineId, pool } from './helpers'

interface ListedRoutine {
  id: number
  position: number | null
}

describe.skipIf(!inject('mysqlAvailable'))('Orden manual de la lista de rutinas', () => {
  let user: number
  let otherUser: number
  let officialA: number
  let officialB: number
  let ownA: number
  let ownB: number

  const listIds = async (userId: number) => {
    const res = await as(userId).get('/api/v1/routines')
    expect(res.status).toBe(200)
    return (res.body.data as ListedRoutine[]).map((r) => r.id)
  }

  const createOwn = async (userId: number, name: string) => {
    const res = await as(userId).post('/api/v1/routines').send({ name })
    expect(res.status).toBe(201)
    return res.body.data.id as number
  }

  beforeAll(async () => {
    user = await createUser()
    otherUser = await createUser()
    officialA = await officialRoutineId('Full Body Principiante')
    officialB = await officialRoutineId('Fuerza Básica con Barra')
    ownA = await createOwn(user, 'Propia A')
    ownB = await createOwn(user, 'Propia B')
  })

  afterAll(async () => {
    await pool.end()
  })

  it('sin orden guardado, las más nuevas salen arriba', async () => {
    const ids = await listIds(user)
    expect(ids.indexOf(ownB)).toBeLessThan(ids.indexOf(ownA))
    expect(ids.indexOf(ownA)).toBeLessThan(ids.indexOf(officialA))
  })

  it('guarda el orden (incluidas oficiales) y lo devuelve con position', async () => {
    const before = await listIds(user)
    const order = [officialB, ownA, officialA, ownB, ...before.filter((id) => ![officialB, ownA, officialA, ownB].includes(id))]

    const res = await as(user).put('/api/v1/routines/order').send({ routine_ids: order })
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual({ routine_ids: order })

    const listed = await as(user).get('/api/v1/routines')
    const data = listed.body.data as ListedRoutine[]
    expect(data.map((r) => r.id)).toEqual(order)
    expect(data.map((r) => r.position)).toEqual(order.map((_, i) => i))
  })

  it('es idempotente', async () => {
    const order = await listIds(user)
    const res = await as(user).put('/api/v1/routines/order').send({ routine_ids: order })
    expect(res.status).toBe(200)
    expect(await listIds(user)).toEqual(order)
  })

  it('una rutina nueva sin posición sale arriba del orden manual', async () => {
    const order = await listIds(user)
    const fresh = await createOwn(user, 'Recién creada')
    expect(await listIds(user)).toEqual([fresh, ...order])
  })

  it('el orden es de cada usuario: a otro no le afecta', async () => {
    const ids = await listIds(otherUser)
    expect(ids.indexOf(officialA)).toBeGreaterThanOrEqual(0)
    const res = await as(otherUser).get('/api/v1/routines')
    expect((res.body.data as ListedRoutine[]).every((r) => r.position === null)).toBe(true)
  })

  it('ids que el usuario no ve → 400 y no se guarda nada', async () => {
    const before = await listIds(user)
    const otherPrivate = await createOwn(otherUser, 'Privada de otro')

    const res = await as(user).put('/api/v1/routines/order').send({ routine_ids: [ownB, otherPrivate] })
    expect(res.status).toBe(400)
    expect(await listIds(user)).toEqual(before)

    const missing = await as(user).put('/api/v1/routines/order').send({ routine_ids: [99999999] })
    expect(missing.status).toBe(400)
  })

  it('valida el body: vacío, repetidos o no numéricos → 400', async () => {
    for (const body of [{ routine_ids: [] }, { routine_ids: [ownA, ownA] }, { routine_ids: ['x'] }, {}]) {
      const res = await as(user).put('/api/v1/routines/order').send(body)
      expect(res.status).toBe(400)
    }
  })
})
