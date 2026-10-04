import { describe, it, expect, vi, beforeEach } from 'vitest'
import { pool } from '../config'
import { addSet, finishSession } from './session.queries'

vi.mock('../config', () => ({
  pool: {
    query: vi.fn(),
    getConnection: vi.fn(),
  },
}))

const conn = {
  beginTransaction: vi.fn(),
  query: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
  release: vi.fn(),
}

describe('session.queries', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(pool.getConnection).mockResolvedValue(conn as any)
  })

  describe('addSet', () => {
    it('devuelve null y no inserta si la sesión no es del usuario o no está en curso', async () => {
      conn.query.mockResolvedValueOnce([[]]) // SELECT ... FOR UPDATE sin filas

      const result = await addSet(1, 2, { exercise_id: 1, set_number: 1, reps_done: 10, weight_kg: 60 })

      expect(result).toBeNull()
      expect(conn.query).toHaveBeenCalledTimes(1)
      const [sql, params] = conn.query.mock.calls[0]
      expect(sql).toMatch(/user_id = \?/)
      expect(sql).toMatch(/status = 'in_progress'/)
      expect(sql).toMatch(/FOR UPDATE/)
      expect(params).toEqual([1, 2])
      expect(conn.rollback).toHaveBeenCalled()
      expect(conn.commit).not.toHaveBeenCalled()
      expect(conn.release).toHaveBeenCalled()
    })

    // Secuencia de queries con peso y reps: sesión, serie, 1RM, récord previo, [upsert]
    const mockSetQueries = (previous: { record_type: string; value: string }[]) => {
      conn.query
        .mockResolvedValueOnce([[{ id: 1 }]])          // SELECT sesión FOR UPDATE
        .mockResolvedValueOnce([{ affectedRows: 1 }])  // INSERT session_exercises
        .mockResolvedValueOnce([{ affectedRows: 1 }])  // INSERT exercise_1rm_history
        .mockResolvedValueOnce([previous])             // SELECT récord previo
        .mockResolvedValueOnce([{ affectedRows: 2 }])  // upsert personal_records
    }

    it('no marca new_pr si el peso no supera el récord previo', async () => {
      mockSetQueries([{ record_type: 'max_weight', value: '100.00' }])

      const result = await addSet(1, 1, { exercise_id: 1, set_number: 2, reps_done: 5, weight_kg: 80 })

      expect(result).toEqual({ new_pr: false })
      const sqls = conn.query.mock.calls.map(c => c[0] as string)
      expect(sqls.some(sql => sql.includes('INSERT INTO personal_records'))).toBe(false)
      expect(conn.commit).toHaveBeenCalled()
    })

    it('no marca new_pr si iguala el récord previo', async () => {
      mockSetQueries([{ record_type: 'max_weight', value: '100.00' }])

      const result = await addSet(1, 1, { exercise_id: 1, set_number: 2, reps_done: 5, weight_kg: 100 })

      expect(result).toEqual({ new_pr: false })
    })

    it('marca new_pr y actualiza achieved_at/session_id antes que value si supera el récord', async () => {
      mockSetQueries([{ record_type: 'max_weight', value: '100.00' }])

      const result = await addSet(1, 1, { exercise_id: 1, set_number: 2, reps_done: 5, weight_kg: 120 })

      expect(result).toEqual({ new_pr: true })
      const upsert = conn.query.mock.calls.find(c => (c[0] as string).includes('INSERT INTO personal_records'))
      expect(upsert).toBeDefined()
      const sql = upsert![0] as string
      expect(sql.indexOf('achieved_at =')).toBeLessThan(sql.indexOf('value       ='))
      expect(sql.indexOf('session_id  =')).toBeLessThan(sql.indexOf('value       ='))
      expect(upsert![1]).toEqual([1, 1, 'max_weight', 120, 1])
    })

    it('marca new_pr la primera vez que se registra el ejercicio', async () => {
      mockSetQueries([])

      const result = await addSet(1, 1, { exercise_id: 1, set_number: 1, reps_done: 5, weight_kg: 60 })

      expect(result).toEqual({ new_pr: true })
    })
  })

  describe('finishSession', () => {
    it('devuelve false y no toca la racha si la sesión ya no estaba en curso', async () => {
      conn.query
        .mockResolvedValueOnce([[{ weight_kg: 70 }]])   // SELECT peso usuario
        .mockResolvedValueOnce([{ affectedRows: 0 }])   // UPDATE sessions

      const result = await finishSession(1, 1, { status: 'completed', duration_seconds: 3600 })

      expect(result).toBe(false)
      const updateSql = conn.query.mock.calls[1][0] as string
      expect(updateSql).toMatch(/status = 'in_progress'/)
      expect(conn.query).toHaveBeenCalledTimes(2)
      expect(conn.rollback).toHaveBeenCalled()
      expect(conn.commit).not.toHaveBeenCalled()
    })
  })
})
