import { describe, it, expect, vi, beforeEach } from 'vitest'
import { pool } from '../config'
import { addSet } from './session.queries'

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
  })
})
