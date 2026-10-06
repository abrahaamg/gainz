import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest'
import { as, createUser, officialRoutineId, pool } from './helpers'

interface ListedRoutine {
  id: number
  is_hidden: boolean
}

describe.skipIf(!inject('mysqlAvailable'))('Ocultar rutinas públicas de la lista', () => {
  let user: number
  let otherUser: number
  let officialId: number

  beforeAll(async () => {
    user = await createUser()
    otherUser = await createUser()
    officialId = await officialRoutineId('Full Body Principiante')
  })

  afterAll(async () => {
    await pool.end()
  })

  const listIds = async (userId: number, query = '') => {
    const res = await as(userId).get(`/api/v1/routines${query}`)
    expect(res.status).toBe(200)
    return res.body.data as ListedRoutine[]
  }

  it('la lista marca is_hidden: false por defecto', async () => {
    const routines = await listIds(user)
    const official = routines.find((r) => r.id === officialId)
    expect(official?.is_hidden).toBe(false)
  })

  it('oculta una rutina oficial y deja de salir en la lista', async () => {
    const res = await as(user).post(`/api/v1/routines/${officialId}/hide`)
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual({ hidden: true })

    const routines = await listIds(user)
    expect(routines.some((r) => r.id === officialId)).toBe(false)
  })

  it('ocultar es idempotente', async () => {
    const res = await as(user).post(`/api/v1/routines/${officialId}/hide`)
    expect(res.status).toBe(200)
  })

  it('con include_hidden=true sale marcada con is_hidden: true', async () => {
    const routines = await listIds(user, '?include_hidden=true')
    const official = routines.find((r) => r.id === officialId)
    expect(official?.is_hidden).toBe(true)
    expect(routines.filter((r) => r.id !== officialId).every((r) => r.is_hidden === false)).toBe(true)
  })

  it('GET /routines/:id sigue funcionando aunque esté oculta', async () => {
    const res = await as(user).get(`/api/v1/routines/${officialId}`)
    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(officialId)
    expect(res.body.data.is_hidden).toBe(true)
    expect(res.body.data.exercises.length).toBeGreaterThan(0)
  })

  it('a otro usuario no le afecta', async () => {
    const routines = await listIds(otherUser)
    const official = routines.find((r) => r.id === officialId)
    expect(official?.is_hidden).toBe(false)
  })

  it('desocultar la devuelve a la lista (idempotente)', async () => {
    const res = await as(user).delete(`/api/v1/routines/${officialId}/hide`)
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual({ hidden: false })

    const again = await as(user).delete(`/api/v1/routines/${officialId}/hide`)
    expect(again.status).toBe(200)

    const routines = await listIds(user)
    expect(routines.find((r) => r.id === officialId)?.is_hidden).toBe(false)
  })

  it('ocultar una rutina propia responde 400', async () => {
    const created = await as(user).post('/api/v1/routines').send({ name: 'Rutina propia' })
    expect(created.status).toBe(201)

    const res = await as(user).post(`/api/v1/routines/${created.body.data.id}/hide`)
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Las rutinas propias se eliminan, no se ocultan')
  })

  it('ocultar una rutina inexistente responde 404', async () => {
    const res = await as(user).post('/api/v1/routines/99999999/hide')
    expect(res.status).toBe(404)
  })

  it('ocultar una rutina privada de otro usuario responde 404', async () => {
    const created = await as(otherUser).post('/api/v1/routines').send({ name: 'Privada de otro' })
    const res = await as(user).post(`/api/v1/routines/${created.body.data.id}/hide`)
    expect(res.status).toBe(404)
  })

  it('un id no numérico responde 400', async () => {
    const res = await as(user).post('/api/v1/routines/abc/hide')
    expect(res.status).toBe(400)
  })
})
