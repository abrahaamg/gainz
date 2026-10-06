import { readdir, readFile } from 'fs/promises'
import path from 'path'
import { Connection } from 'mysql2/promise'
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest'
import { openMigrationConnection, runPending } from '../../db/migrator'
import { pool, queryRows } from './helpers'

const SEEDS_DIR = path.resolve(__dirname, '..', '..', 'db', 'seeds')

const countRows = async () => {
  const [row] = await queryRows(
    `SELECT
       (SELECT COUNT(*) FROM users)              AS users,
       (SELECT COUNT(*) FROM exercises)          AS exercises,
       (SELECT COUNT(*) FROM exercise_equipment) AS exercise_equipment,
       (SELECT COUNT(*) FROM routines)           AS routines,
       (SELECT COUNT(*) FROM routine_exercises)  AS routine_exercises,
       (SELECT COUNT(*) FROM equipment_catalog)  AS equipment_catalog`
  )
  return row
}

describe.skipIf(!inject('mysqlAvailable'))('Migraciones y seeds', () => {
  let conn: Connection

  beforeAll(async () => {
    conn = await openMigrationConnection()
  })

  afterAll(async () => {
    await conn.end()
    await pool.end()
  })

  it('una BD recién montada tiene todo registrado y no queda nada pendiente', async () => {
    expect(await runPending(conn, 'migrations')).toEqual([])
    expect(await runPending(conn, 'seeds')).toEqual([])
  })

  it('los seeds dejan los datos de catálogo esperados', async () => {
    const counts = await countRows()
    expect(Number(counts.equipment_catalog)).toBe(25)
    expect(Number(counts.routines)).toBeGreaterThanOrEqual(5)

    const [bench] = await queryRows(
      "SELECT secondary_muscles, requires_equipment FROM exercises WHERE name = 'Press de Banca' AND created_by IS NULL"
    )
    expect(bench.secondary_muscles).toEqual(['triceps', 'shoulders'])
    const benchLinks = await queryRows(
      `SELECT ee.equipment_name FROM exercise_equipment ee
       JOIN exercises e ON e.id = ee.exercise_id
       WHERE e.name = 'Press de Banca' AND e.created_by IS NULL`
    )
    expect(benchLinks.length).toBeGreaterThan(0)
  })

  it('volver a ejecutar todos los seeds no duplica nada', async () => {
    const before = await countRows()

    const files = (await readdir(SEEDS_DIR)).filter((name) => name.endsWith('.sql')).sort()
    for (const name of files) {
      await conn.query(await readFile(path.join(SEEDS_DIR, name), 'utf8'))
    }

    expect(await countRows()).toEqual(before)
  })
})
