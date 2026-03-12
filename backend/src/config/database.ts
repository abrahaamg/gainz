import mysql from 'mysql2/promise'
import { config } from './config'

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  waitForConnections: true,
  connectionLimit: 10,
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
