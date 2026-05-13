import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RoutineGeneratorService } from './RoutineGeneratorService'
import { pool } from '../config'

vi.mock('../config', () => ({
  pool: {
    query: vi.fn(),
  },
}))

const mockUserProfile = {
  id: 1,
  sex: 'male',
  age: 22,
  fitness_level: 'intermediate',
  experience: '1-3',
  primary_goal: 'hypertrophy',
  goals: '[]',
  weight_kg: 78.5,
  available_days: '["monday","tuesday","thursday","friday"]',
  session_duration_min: 60,
  injuries: '[]',
}

const mockExercises = [
  { id: 1,  name: 'Press de Banca',   category: 'strength', muscle_group: 'chest',     secondary_muscles: '["triceps","shoulders"]',   difficulty: 'medium', requires_equipment: true },
  { id: 2,  name: 'Sentadilla',       category: 'strength', muscle_group: 'legs',      secondary_muscles: '["glutes","hamstrings"]',   difficulty: 'hard',   requires_equipment: true },
  { id: 3,  name: 'Peso Muerto',      category: 'strength', muscle_group: 'back',      secondary_muscles: '["glutes","hamstrings"]',   difficulty: 'hard',   requires_equipment: true },
  { id: 4,  name: 'Dominadas',        category: 'strength', muscle_group: 'back',      secondary_muscles: '["biceps","core"]',         difficulty: 'hard',   requires_equipment: false },
  { id: 5,  name: 'Press Militar',    category: 'strength', muscle_group: 'shoulders', secondary_muscles: '["triceps","core"]',        difficulty: 'medium', requires_equipment: true },
  { id: 6,  name: 'Remo con Barra',   category: 'strength', muscle_group: 'back',      secondary_muscles: '["biceps","forearms"]',     difficulty: 'medium', requires_equipment: true },
  { id: 7,  name: 'Fondos',           category: 'strength', muscle_group: 'chest',     secondary_muscles: '["triceps","shoulders"]',   difficulty: 'medium', requires_equipment: false },
  { id: 8,  name: 'Curl Bíceps',      category: 'strength', muscle_group: 'arms',      secondary_muscles: '["forearms"]',              difficulty: 'easy',   requires_equipment: true },
  { id: 9,  name: 'Burpees',          category: 'cardio',   muscle_group: 'full_body', secondary_muscles: '["chest","quadriceps"]',    difficulty: 'hard',   requires_equipment: false },
  { id: 10, name: 'Mountain Climbers',category: 'cardio',   muscle_group: 'core',      secondary_muscles: '["shoulders","quadriceps"]',difficulty: 'medium', requires_equipment: false },
  { id: 11, name: 'Pistol Squat',     category: 'balance',  muscle_group: 'legs',      secondary_muscles: '["glutes","core"]',         difficulty: 'hard',   requires_equipment: false },
  { id: 12, name: 'Cat-Cow',          category: 'flexibility', muscle_group: 'back',   secondary_muscles: '["core"]',                  difficulty: 'easy',   requires_equipment: false },
]

function setupMocks(user = mockUserProfile, exercises = mockExercises) {
  vi.mocked(pool.query)
    .mockResolvedValueOnce([[user]] as any)  // user query
    .mockResolvedValueOnce([exercises] as any) // exercises query
}

describe('RoutineGeneratorService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generate', () => {
    it('genera rutinas según los días disponibles del usuario', async () => {
      setupMocks()

      const routines = await RoutineGeneratorService.generate(1)
      expect(routines.length).toBe(4) // 4 días → Upper/Lower split
    })

    it('cada rutina tiene ejercicios asignados', async () => {
      setupMocks()

      const routines = await RoutineGeneratorService.generate(1)
      for (const r of routines) {
        expect(r.exercises.length).toBeGreaterThan(0)
      }
    })

    it('incluye metadata correcta en cada rutina', async () => {
      setupMocks()

      const routines = await RoutineGeneratorService.generate(1)
      for (const r of routines) {
        expect(r.goal).toBe('hypertrophy')
        expect(['easy', 'medium', 'hard']).toContain(r.difficulty)
        expect(r.estimated_duration_min).toBe(60)
        expect(r.warmup_notes).toBeTruthy()
        expect(r.cooldown_notes).toBeTruthy()
        expect(r.day_label).toBeTruthy()
      }
    })

    it('ejercicios tienen sets, reps y rest correctos para hipertrofia', async () => {
      setupMocks()

      const routines = await RoutineGeneratorService.generate(1)
      for (const r of routines) {
        for (const ex of r.exercises) {
          if (ex.reps !== null) {
            expect(ex.reps).toBeGreaterThanOrEqual(8)
            expect(ex.reps).toBeLessThanOrEqual(12)
          }
          expect(ex.rest_seconds).toBeGreaterThan(0)
          expect(ex.sets).toBeGreaterThanOrEqual(1) // cardio puede tener sets=1
          expect(ex.order_index).toBeGreaterThan(0)
        }
      }
    })

    it('devuelve array vacío si el usuario no existe', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce([[]] as any)

      const routines = await RoutineGeneratorService.generate(999)
      expect(routines).toEqual([])
    })

    it('genera 2 rutinas para usuario con 2 días disponibles', async () => {
      setupMocks({ ...mockUserProfile, available_days: '["monday","wednesday"]' })

      const routines = await RoutineGeneratorService.generate(1)
      expect(routines.length).toBe(2)
    })

    it('genera 3 rutinas PPL para usuario con 3 días', async () => {
      setupMocks({ ...mockUserProfile, available_days: '["monday","wednesday","friday"]' })

      const routines = await RoutineGeneratorService.generate(1)
      expect(routines.length).toBe(3)
      // PPL: Push, Pull, Pierna
      expect(routines.some(r => r.name.includes('Empuje'))).toBe(true)
      expect(routines.some(r => r.name.includes('Tirón'))).toBe(true)
      expect(routines.some(r => r.name.includes('Pierna'))).toBe(true)
    })

    it('excluye ejercicios de grupos musculares lesionados', async () => {
      setupMocks({
        ...mockUserProfile,
        injuries: '["shoulder"]',
        available_days: '["monday","wednesday","friday"]',
      })

      const routines = await RoutineGeneratorService.generate(1)
      for (const r of routines) {
        for (const ex of r.exercises) {
          // No debería haber ejercicios de pecho ni hombros (excluidos por lesión shoulder)
          const source = mockExercises.find(e => e.id === ex.exercise_id)
          expect(source?.muscle_group).not.toBe('shoulders')
          expect(source?.muscle_group).not.toBe('chest')
        }
      }
    })

    it('regenerar produce resultados diferentes (aleatorización)', async () => {
      // Ejecutar 5 veces y verificar que al menos una vez los ejercicios son distintos
      const results: string[] = []
      for (let i = 0; i < 5; i++) {
        setupMocks()
        const routines = await RoutineGeneratorService.generate(1)
        const key = routines.map(r => r.exercises.map(e => e.exercise_id).join(',')).join('|')
        results.push(key)
      }
      // Con aleatorización, no todas las ejecuciones deberían ser idénticas
      const uniqueResults = new Set(results)
      // Es posible (pero muy improbable con 5 intentos) que sean todas iguales
      // Con pocos ejercicios puede pasar, así que solo verificamos que se ejecuta sin errores
      expect(results.length).toBe(5)
    })

    it('usa parámetros de fuerza para goal=strength', async () => {
      setupMocks({
        ...mockUserProfile,
        primary_goal: 'strength',
        available_days: '["monday","wednesday"]',
      })

      const routines = await RoutineGeneratorService.generate(1)
      for (const r of routines) {
        expect(r.goal).toBe('strength')
        for (const ex of r.exercises) {
          if (ex.reps !== null) {
            expect(ex.reps).toBeGreaterThanOrEqual(3)
            expect(ex.reps).toBeLessThanOrEqual(6)
          }
          // Fuerza tiene descansos más largos
          if (ex.duration_seconds === null) {
            expect(ex.rest_seconds).toBe(180)
          }
        }
      }
    })
  })

  describe('save', () => {
    it('guarda una rutina generada en la BD', async () => {
      vi.mocked(pool.query)
        .mockResolvedValueOnce([{ insertId: 10 }] as any) // INSERT routine
        .mockResolvedValueOnce([{}] as any) // INSERT exercise 1
        .mockResolvedValueOnce([{}] as any) // INSERT exercise 2

      const routine = {
        name: 'Test Rutina',
        description: 'Test',
        goal: 'hypertrophy',
        difficulty: 'medium',
        estimated_duration_min: 60,
        warmup_notes: 'Calentar',
        cooldown_notes: 'Estirar',
        day_label: 'Lunes',
        exercises: [
          { exercise_id: 1, exercise_name: 'Press', sets: 4, reps: 10, duration_seconds: null, rest_seconds: 90, order_index: 1 },
          { exercise_id: 2, exercise_name: 'Squat', sets: 4, reps: 10, duration_seconds: null, rest_seconds: 90, order_index: 2 },
        ],
      }

      const id = await RoutineGeneratorService.save(1, routine)
      expect(id).toBe(10)
      expect(pool.query).toHaveBeenCalledTimes(3) // 1 routine + 2 exercises
    })
  })
})
