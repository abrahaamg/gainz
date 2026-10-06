import mysql from 'mysql2/promise'
import type { TestProject } from 'vitest/node'
import { config, connectionOptions } from '../../config'
import { openMigrationConnection, runPending } from '../../db/migrator'

declare module 'vitest' {
  export interface ProvidedContext {
    mysqlAvailable: boolean
  }
}

const UNREACHABLE_CODES = new Set(['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EHOSTUNREACH'])

/**
 * Monta la BD de tests desde cero: la borra, la crea y aplica migraciones y
 * seeds con el mismo runner que producción. Si no hay servidor MySQL, avisa y
 * marca los tests para saltarse.
 */
export default async function setup(project: TestProject): Promise<void> {
  const dbName = config.db.name
  if (!dbName.endsWith('_test')) {
    throw new Error(`Los tests de integración solo corren contra una BD *_test (DB_NAME=${dbName})`)
  }

  const { database: _database, ...serverOptions } = connectionOptions()
  let server: mysql.Connection
  try {
    server = await mysql.createConnection(serverOptions)
  } catch (err) {
    // Sin servidor se saltan; con servidor pero credenciales malas, fallan
    const code = (err as { code?: string }).code ?? ''
    if (!UNREACHABLE_CODES.has(code)) throw err
    console.warn(`[integración] MySQL no disponible en ${config.db.host}:${config.db.port} (${code}): se saltan los tests`)
    project.provide('mysqlAvailable', false)
    return
  }

  try {
    await server.query(`DROP DATABASE IF EXISTS ${mysql.escapeId(dbName)}`)
  } finally {
    await server.end()
  }

  const conn = await openMigrationConnection()
  try {
    await runPending(conn, 'migrations')
    await runPending(conn, 'seeds')
  } finally {
    await conn.end()
  }
  project.provide('mysqlAvailable', true)
}
