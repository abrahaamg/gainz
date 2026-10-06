import mysql, { ConnectionOptions } from 'mysql2/promise'
import { config } from './config'

/**
 * Opciones de conexión compartidas por el pool de la API y por el runner de
 * migraciones, para que los dos se conecten igual (mismo host, misma BD, TLS).
 */
export const connectionOptions = (): ConnectionOptions => ({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  ssl: config.db.ssl ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
})

export const pool = mysql.createPool({
  ...connectionOptions(),
  waitForConnections: true,
  connectionLimit: config.db.poolLimit,
  queueLimit: 0,
})

export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const connection = await pool.getConnection()
    await connection.query('SELECT 1')
    connection.release()
    return true
  } catch {
    return false
  }
}
