import request from 'supertest'
import { ResultSetHeader, RowDataPacket } from 'mysql2'
import app from '../../app'
import { pool } from '../../config'

export { pool }

let userCounter = 0

/** Crea un usuario nuevo en la BD de tests y devuelve su id. */
export const createUser = async (): Promise<number> => {
  userCounter += 1
  const username = `test_${process.pid}_${Date.now()}_${userCounter}`
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO users (username, email, weight_kg) VALUES (?, NULL, 70)',
    [username]
  )
  return result.insertId
}

/** Cliente HTTP que hace las peticiones como el usuario indicado. */
export const as = (userId: number) => {
  const withUser = (req: request.Test) => req.set('x-test-user-id', String(userId))
  const agent = request(app)
  return {
    get: (url: string) => withUser(agent.get(url)),
    post: (url: string) => withUser(agent.post(url)),
    put: (url: string) => withUser(agent.put(url)),
    delete: (url: string) => withUser(agent.delete(url)),
  }
}

export const queryRows = async (sql: string, params: unknown[] = []): Promise<RowDataPacket[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(sql, params)
  return rows
}

/** Id de un ejercicio del catálogo por nombre. */
export const catalogExerciseId = async (name: string): Promise<number> => {
  const rows = await queryRows('SELECT id FROM exercises WHERE name = ? AND created_by IS NULL', [name])
  if (!rows.length) throw new Error(`Ejercicio de catálogo "${name}" no encontrado en la BD de tests`)
  return rows[0].id as number
}

/** Id de una rutina oficial (user 1) por nombre. */
export const officialRoutineId = async (name: string): Promise<number> => {
  const rows = await queryRows('SELECT id FROM routines WHERE user_id = 1 AND name = ?', [name])
  if (!rows.length) throw new Error(`Rutina oficial "${name}" no encontrada en la BD de tests`)
  return rows[0].id as number
}
