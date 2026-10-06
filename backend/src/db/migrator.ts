import { readdir, readFile } from 'fs/promises'
import path from 'path'
import mysql, { Connection, RowDataPacket } from 'mysql2/promise'
import { config, connectionOptions } from '../config'

/**
 * Runner de migraciones y seeds.
 *
 * Cada tipo de fichero lleva su propia tabla de control con los ya aplicados
 * (nombre, aplicada_en). Al ejecutarse aplica, en orden alfabético, los .sql
 * de su carpeta que todavía no estén registrados, y registra cada uno justo
 * después de aplicarlo.
 *
 * Los ficheros se ejecutan enteros en una sola llamada (multipleStatements),
 * sin trocearlos: así no hay que interpretar el SQL. Por eso no pueden llevar
 * DELIMITER ni procedimientos almacenados (TiDB tampoco los admite) ni USE:
 * siempre se trabaja sobre la BD de DB_NAME.
 */

export type SqlKind = 'migrations' | 'seeds'

const TRACKING_TABLE: Record<SqlKind, string> = {
  migrations: 'schema_migrations',
  seeds: 'schema_seeds',
}

// Desde src/db (tsx) y desde dist/db (node) apunta a la misma carpeta: los
// .sql no se copian a dist, se leen siempre de src.
const SQL_ROOT = path.resolve(__dirname, '..', '..', 'src', 'db')

const ER_BAD_DB_ERROR = 1049

/**
 * Abre una conexión dedicada con multipleStatements contra DB_NAME. Si la BD no
 * existe (MySQL local recién instalado o la BD de tests) la crea; en TiDB Cloud
 * la BD ya viene creada y no se toca.
 */
export const openMigrationConnection = async (): Promise<Connection> => {
  const options = { ...connectionOptions(), multipleStatements: true }
  try {
    return await mysql.createConnection(options)
  } catch (err) {
    if ((err as { errno?: number }).errno !== ER_BAD_DB_ERROR) throw err
  }

  const { database, ...serverOptions } = options
  const conn = await mysql.createConnection(serverOptions)
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS ${mysql.escapeId(String(database))}
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  )
  await conn.changeUser({ database })
  return conn
}

const listSqlFiles = async (kind: SqlKind): Promise<string[]> => {
  const entries = await readdir(path.join(SQL_ROOT, kind), { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort()
}

const ensureTrackingTable = async (conn: Connection, kind: SqlKind): Promise<void> => {
  await conn.query(
    `CREATE TABLE IF NOT EXISTS ${TRACKING_TABLE[kind]} (
       nombre      VARCHAR(255) PRIMARY KEY,
       aplicada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`
  )
}

const findApplied = async (conn: Connection, kind: SqlKind): Promise<Set<string>> => {
  const [rows] = await conn.query<RowDataPacket[]>(`SELECT nombre FROM ${TRACKING_TABLE[kind]}`)
  return new Set(rows.map((row) => row.nombre as string))
}

const markApplied = async (conn: Connection, kind: SqlKind, name: string): Promise<void> => {
  await conn.query(`INSERT IGNORE INTO ${TRACKING_TABLE[kind]} (nombre) VALUES (?)`, [name])
}

// Un fichero que solo tiene comentarios no se manda: MySQL responde "Query was empty"
const hasStatements = (sql: string): boolean =>
  sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .some((line) => line.trim() !== '' && !line.trim().startsWith('--'))

export interface RunOptions {
  /** Registra los pendientes como aplicados sin ejecutarlos. */
  baseline?: boolean
  log?: (message: string) => void
}

/**
 * Aplica (o con baseline, solo registra) los ficheros pendientes de `kind`.
 * Devuelve los nombres procesados en esta ejecución.
 */
export const runPending = async (
  conn: Connection,
  kind: SqlKind,
  { baseline = false, log = () => undefined }: RunOptions = {}
): Promise<string[]> => {
  await ensureTrackingTable(conn, kind)
  const applied = await findApplied(conn, kind)
  const pending = (await listSqlFiles(kind)).filter((name) => !applied.has(name))

  for (const name of pending) {
    if (!baseline) {
      const sql = await readFile(path.join(SQL_ROOT, kind, name), 'utf8')
      if (hasStatements(sql)) {
        try {
          await conn.query(sql)
        } catch (err) {
          throw new Error(`Falló ${kind}/${name} en la BD ${config.db.name}: ${(err as Error).message}`)
        }
      }
    }
    await markApplied(conn, kind, name)
    log(`${baseline ? 'registrada' : 'aplicada'}: ${kind}/${name}`)
  }

  if (!pending.length) log(`${kind}: nada pendiente`)
  return pending
}
