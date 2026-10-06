import { describe, it, expect, vi, beforeEach } from 'vitest'
import { pool } from '../config'
import { addSet, finishSession, getLastSessionSets } from './session.queries'

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

    it('devuelve null y no inserta si el ejercicio es privado de otro usuario', async () => {
      conn.query
        .mockResolvedValueOnce([[{ id: 1 }]]) // SELECT sesión FOR UPDATE
        .mockResolvedValueOnce([[]])          // SELECT ejercicio accesible, sin filas

      const result = await addSet(1, 2, { exercise_id: 99, set_number: 1, reps_done: 10, weight_kg: 60 })

      expect(result).toBeNull()
      expect(conn.query).toHaveBeenCalledTimes(2)
      const [sql, params] = conn.query.mock.calls[1]
      expect(sql).toMatch(/is_public = 1 OR created_by = \?/)
      expect(params).toEqual([99, 2])
      expect(conn.rollback).toHaveBeenCalled()
      expect(conn.commit).not.toHaveBeenCalled()
    })

    // Secuencia de queries con peso y reps: sesión, ejercicio, serie, 1RM, récord previo, [upsert]
    const mockSetQueries = (previous: { record_type: string; value: string }[]) => {
      conn.query
        .mockResolvedValueOnce([[{ id: 1 }]])          // SELECT sesión FOR UPDATE
        .mockResolvedValueOnce([[{ id: 1 }]])          // SELECT ejercicio accesible
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

  describe('getLastSessionSets', () => {
    it('filtra por usuario, sesión completada y series completadas', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce([[]] as any)

      await getLastSessionSets(7, 3)

      const [sql, params] = vi.mocked(pool.query).mock.calls[0] as unknown as [string, unknown[]]
      expect(sql).toMatch(/s\.user_id = \?/)
      expect(sql).toMatch(/s\.status = 'completed'/)
      expect(sql).toMatch(/se\.completed = true/)
      expect(sql).toMatch(/LIMIT 1/)
      expect(params).toEqual([3, 7, 3])
    })

    it('convierte a número y con set_number repetido se queda la última', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce([[
        { set_number: 1, reps_done: 10, weight_kg: '20.00', rpe: 7 },
        { set_number: 2, reps_done: 8, weight_kg: '20.00', rpe: null },
        { set_number: 2, reps_done: 9, weight_kg: '22.50', rpe: 8 },
        { set_number: 3, reps_done: null, weight_kg: null, rpe: null },
      ]] as any)

      expect(await getLastSessionSets(1, 1)).toEqual([
        { set_number: 1, reps_done: 10, weight_kg: 20, rpe: 7 },
        { set_number: 2, reps_done: 9, weight_kg: 22.5, rpe: 8 },
        { set_number: 3, reps_done: null, weight_kg: null, rpe: null },
      ])
    })

    it('sin historial devuelve []', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce([[]] as any)
      expect(await getLastSessionSets(1, 1)).toEqual([])
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

    // Secuencia: peso usuario, UPDATE sesión, SELECT racha, UPDATE/INSERT racha
    const mockFinishQueries = (streakRows: Record<string, unknown>[]) => {
      conn.query
        .mockResolvedValueOnce([[{ weight_kg: 70 }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([streakRows])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
    }
    const streakUpdate = () => conn.query.mock.calls[3] as [string, unknown[]]

    it('no sube la racha si ya entrenó hoy (fecha calculada en SQL)', async () => {
      mockFinishQueries([{ current_streak: 4, longest_streak: 6, diff_days: 0 }])

      const result = await finishSession(1, 1, { status: 'completed', duration_seconds: 1800 })

      expect(result).toBe(true)
      expect(conn.query.mock.calls[2][0]).toMatch(/DATEDIFF\(CURDATE\(\), last_workout_date\)/)
      const [sql, params] = streakUpdate()
      expect(sql).toMatch(/last_workout_date = CURDATE\(\)/)
      // [current_streak, longest_streak, +workouts, +minutos, userId]
      expect(params).toEqual([4, 6, 0, 30, 1])
      expect(conn.commit).toHaveBeenCalled()
    })

    it('suma 1 a la racha si entrenó ayer', async () => {
      mockFinishQueries([{ current_streak: 6, longest_streak: 6, diff_days: 1 }])

      await finishSession(1, 1, { status: 'completed', duration_seconds: 600 })

      expect(streakUpdate()[1]).toEqual([7, 7, 1, 10, 1])
    })

    it('reinicia la racha a 1 si pasó más de un día', async () => {
      mockFinishQueries([{ current_streak: 6, longest_streak: 9, diff_days: 3 }])

      await finishSession(1, 1, { status: 'completed', duration_seconds: 600 })

      expect(streakUpdate()[1]).toEqual([1, 9, 1, 10, 1])
    })

    it('empieza la racha en 1 si nunca había entrenado', async () => {
      mockFinishQueries([{ current_streak: 0, longest_streak: 0, diff_days: null }])

      await finishSession(1, 1, { status: 'completed', duration_seconds: 600 })

      expect(streakUpdate()[1]).toEqual([1, 1, 1, 10, 1])
    })

    it('crea la fila de racha con CURDATE() si no existe', async () => {
      mockFinishQueries([])

      await finishSession(1, 1, { status: 'completed', duration_seconds: 600 })

      const [sql, params] = streakUpdate()
      expect(sql).toMatch(/INSERT INTO streaks/)
      expect(sql).toMatch(/CURDATE\(\)/)
      expect(params).toEqual([1, 10])
    })
  })
})
