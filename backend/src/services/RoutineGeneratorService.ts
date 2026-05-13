import { RowDataPacket } from 'mysql2'
import { pool } from '../config'

/* ─── Types ──────────────────────────────────────────────────── */

interface UserProfile {
  id: number
  sex: string | null
  age: number | null
  fitness_level: string | null
  experience: string | null
  primary_goal: string | null
  goals: string[] | null
  weight_kg: number | null
  available_days: string[] | null
  session_duration_min: number | null
  injuries: string[] | null
}

interface ExerciseRow {
  id: number
  name: string
  category: string
  muscle_group: string
  secondary_muscles: string[]
  difficulty: string
  requires_equipment: boolean
}

interface GeneratedExercise {
  exercise_id: number
  exercise_name: string
  sets: number
  reps: number | null
  duration_seconds: number | null
  rest_seconds: number
  order_index: number
}

export interface GeneratedRoutine {
  name: string
  description: string
  goal: string
  difficulty: string
  estimated_duration_min: number
  warmup_notes: string
  cooldown_notes: string
  day_label: string
  exercises: GeneratedExercise[]
}

/* ─── Muscle groups by injury ────────────────────────────────── */

const INJURY_EXCLUSIONS: Record<string, string[]> = {
  shoulder: ['shoulders', 'chest'],
  knee: ['quadriceps', 'legs'],
  lower_back: ['back', 'lats', 'upper_back'],
  wrist: ['forearms'],
  hip: ['glutes', 'hamstrings', 'legs'],
  ankle: ['calves', 'legs'],
  neck: ['upper_back'],
  elbow: ['biceps', 'triceps', 'arms'],
}

/* ─── Split definitions ──────────────────────────────────────── */

interface SplitDay {
  label: string
  muscleGroups: string[]
  categories: string[]  // exercise categories to include
}

function getSplit(numDays: number): SplitDay[] {
  if (numDays <= 2) {
    return [
      { label: 'Full Body A', muscleGroups: ['chest', 'back', 'lats', 'upper_back', 'shoulders', 'quadriceps', 'legs', 'glutes', 'hamstrings', 'core'], categories: ['strength', 'hiit'] },
      { label: 'Full Body B', muscleGroups: ['chest', 'back', 'lats', 'upper_back', 'shoulders', 'arms', 'biceps', 'triceps', 'quadriceps', 'legs', 'glutes', 'calves', 'core'], categories: ['strength', 'hiit'] },
    ]
  }
  if (numDays === 3) {
    return [
      { label: 'Empuje (Push)', muscleGroups: ['chest', 'shoulders', 'triceps', 'arms'], categories: ['strength'] },
      { label: 'Tirón (Pull)', muscleGroups: ['back', 'lats', 'upper_back', 'biceps', 'arms', 'forearms'], categories: ['strength'] },
      { label: 'Pierna', muscleGroups: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'legs', 'core'], categories: ['strength'] },
    ]
  }
  if (numDays === 4) {
    return [
      { label: 'Tren Superior A', muscleGroups: ['chest', 'back', 'lats', 'shoulders', 'triceps', 'arms'], categories: ['strength'] },
      { label: 'Tren Inferior A', muscleGroups: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'legs', 'core'], categories: ['strength'] },
      { label: 'Tren Superior B', muscleGroups: ['chest', 'upper_back', 'shoulders', 'biceps', 'arms', 'forearms'], categories: ['strength'] },
      { label: 'Tren Inferior B', muscleGroups: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'legs', 'core'], categories: ['strength'] },
    ]
  }
  if (numDays === 5) {
    return [
      { label: 'Empuje', muscleGroups: ['chest', 'shoulders', 'triceps', 'arms'], categories: ['strength'] },
      { label: 'Tirón', muscleGroups: ['back', 'lats', 'upper_back', 'biceps', 'arms'], categories: ['strength'] },
      { label: 'Pierna', muscleGroups: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'legs'], categories: ['strength'] },
      { label: 'Tren Superior', muscleGroups: ['chest', 'back', 'lats', 'upper_back', 'shoulders', 'triceps', 'biceps', 'arms'], categories: ['strength'] },
      { label: 'Tren Inferior + Core', muscleGroups: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'legs', 'core'], categories: ['strength'] },
    ]
  }
  // 6+ days
  return [
    { label: 'Empuje A', muscleGroups: ['chest', 'shoulders', 'triceps', 'arms'], categories: ['strength'] },
    { label: 'Tirón A', muscleGroups: ['back', 'lats', 'upper_back', 'biceps', 'arms'], categories: ['strength'] },
    { label: 'Pierna A', muscleGroups: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'legs'], categories: ['strength'] },
    { label: 'Empuje B', muscleGroups: ['chest', 'shoulders', 'triceps', 'arms'], categories: ['strength'] },
    { label: 'Tirón B', muscleGroups: ['back', 'lats', 'upper_back', 'biceps', 'arms'], categories: ['strength'] },
    { label: 'Pierna B + Core', muscleGroups: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'legs', 'core'], categories: ['strength'] },
  ]
}

/* ─── Goal-based parameters ──────────────────────────────────── */

interface GoalParams {
  setsPerExercise: number
  repsRange: [number, number]
  restSeconds: number
  exercisesPerDay: number
  description: string
}

function getGoalParams(goal: string, experience: string, durationMin: number): GoalParams {
  const isAdvanced = experience === 'more_than_3y' || experience === '1_to_3y'
  const baseSets = isAdvanced ? 4 : 3
  // Scale exercises to fit session duration (approx 4 min per exercise)
  const maxExercises = Math.min(Math.floor(durationMin / 4), isAdvanced ? 8 : 6)

  switch (goal) {
    case 'strength':
    case 'improve_lifts':
      return {
        setsPerExercise: baseSets + 1,
        repsRange: [3, 6],
        restSeconds: 180,
        exercisesPerDay: Math.min(maxExercises, 5),
        description: 'Rutina enfocada en fuerza máxima con cargas pesadas y descansos amplios.',
      }
    case 'hypertrophy':
    case 'v_shape':
      return {
        setsPerExercise: baseSets,
        repsRange: [8, 12],
        restSeconds: 90,
        exercisesPerDay: maxExercises,
        description: 'Rutina de hipertrofia con volumen moderado-alto para maximizar el crecimiento muscular.',
      }
    case 'fat_loss':
      return {
        setsPerExercise: 3,
        repsRange: [12, 15],
        restSeconds: 45,
        exercisesPerDay: maxExercises,
        description: 'Rutina de alta intensidad con descansos cortos para maximizar la quema calórica.',
      }
    case 'glutes_legs':
      return {
        setsPerExercise: baseSets,
        repsRange: [10, 15],
        restSeconds: 75,
        exercisesPerDay: maxExercises,
        description: 'Rutina enfocada en glúteos y piernas con volumen alto en tren inferior.',
      }
    case 'cardio_endurance':
      return {
        setsPerExercise: 3,
        repsRange: [15, 20],
        restSeconds: 30,
        exercisesPerDay: maxExercises,
        description: 'Rutina de resistencia muscular con repeticiones altas y circuitos.',
      }
    case 'athletic':
      return {
        setsPerExercise: baseSets,
        repsRange: [6, 10],
        restSeconds: 90,
        exercisesPerDay: maxExercises,
        description: 'Rutina enfocada en rendimiento atlético: potencia, velocidad y coordinación.',
      }
    default: // general_fitness
      return {
        setsPerExercise: 3,
        repsRange: [10, 12],
        restSeconds: 60,
        exercisesPerDay: maxExercises,
        description: 'Rutina equilibrada para mantenerte en forma con un enfoque general.',
      }
  }
}

/* ─── Sex-based emphasis ─────────────────────────────────────── */

function getEmphasis(sex: string | null, goal: string | null): string[] {
  if (sex === 'female') {
    if (goal === 'glutes_legs') return ['glutes', 'hamstrings', 'quadriceps', 'legs']
    return ['glutes', 'hamstrings', 'core']
  }
  if (goal === 'v_shape') return ['lats', 'back', 'upper_back', 'shoulders']
  return []
}

/* ─── Difficulty from experience ─────────────────────────────── */

function getDifficulty(experience: string | null): string {
  if (experience === 'more_than_3y') return 'hard'
  if (experience === '1_to_3y') return 'medium'
  return 'easy'
}

/* ─── Main service ───────────────────────────────────────────── */

export const RoutineGeneratorService = {

  async generate(userId: number): Promise<GeneratedRoutine[]> {
    // 1. Get user profile
    const [userRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, sex, age, fitness_level, experience, primary_goal, goals,
              weight_kg, available_days, session_duration_min, injuries
       FROM users WHERE id = ?`,
      [userId]
    )
    if (!userRows.length) return []

    const user = userRows[0] as unknown as UserProfile
    if (typeof user.goals === 'string') user.goals = JSON.parse(user.goals as string)
    if (typeof user.available_days === 'string') user.available_days = JSON.parse(user.available_days as string)
    if (typeof user.injuries === 'string') user.injuries = JSON.parse(user.injuries as string)

    const numDays = user.available_days?.length ?? 3
    const duration = user.session_duration_min ?? 60
    const goal = user.primary_goal ?? 'general_fitness'
    const experience = user.experience ?? 'none'
    const difficulty = getDifficulty(experience)
    const emphasis = getEmphasis(user.sex, goal)

    // 2. Get accessible exercises
    const [exercises] = await pool.query<RowDataPacket[]>(`
      SELECT DISTINCT e.id, e.name, e.category, e.muscle_group, e.secondary_muscles,
             e.difficulty, e.requires_equipment
      FROM exercises e
      WHERE e.is_public = true
        AND (
          e.requires_equipment = false
          OR NOT EXISTS (
            SELECT 1 FROM exercise_equipment ee
            WHERE ee.exercise_id = e.id AND ee.is_optional = false
              AND ee.equipment_name NOT IN (
                SELECT COALESCE(eq.catalog_name, eq.name) FROM equipment eq WHERE eq.user_id = ?
              )
          )
        )
    `, [userId])

    const pool_ = (exercises as RowDataPacket[]).map(row => ({
      ...row,
      secondary_muscles: Array.isArray(row.secondary_muscles)
        ? row.secondary_muscles
        : typeof row.secondary_muscles === 'string'
          ? JSON.parse(row.secondary_muscles)
          : [],
    })) as ExerciseRow[]

    // 3. Filter by injuries
    const excludedGroups = new Set<string>()
    if (user.injuries?.length) {
      for (const injury of user.injuries) {
        const excluded = INJURY_EXCLUSIONS[injury]
        if (excluded) excluded.forEach(g => excludedGroups.add(g))
      }
    }
    const safeExercises = excludedGroups.size > 0
      ? pool_.filter(e =>
          !excludedGroups.has(e.muscle_group) &&
          !e.secondary_muscles.some(m => excludedGroups.has(m))
        )
      : pool_

    // 4. Filter by difficulty
    const difficultyOrder = ['easy', 'medium', 'hard']
    const maxDiffIdx = difficultyOrder.indexOf(difficulty)
    const filteredByDiff = safeExercises.filter(e =>
      difficultyOrder.indexOf(e.difficulty) <= maxDiffIdx + 1 // allow one level above
    )
    const exercisePool = filteredByDiff.length >= 5 ? filteredByDiff : safeExercises

    // 5. Generate split
    const split = getSplit(numDays)
    const goalParams = getGoalParams(goal, experience, duration)

    // 6. Map days to available_days
    const dayNames = user.available_days ?? ['monday', 'wednesday', 'friday']
    const DAY_LABELS: Record<string, string> = {
      monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
      thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
    }

    const routines: GeneratedRoutine[] = []

    for (let i = 0; i < Math.min(split.length, numDays); i++) {
      const splitDay = split[i]
      const dayName = dayNames[i] ? DAY_LABELS[dayNames[i]] : `Día ${i + 1}`

      // Pick exercises for this day
      const dayExercises = pickExercisesForDay(
        exercisePool, splitDay, goalParams, emphasis, goal
      )

      if (dayExercises.length === 0) continue

      routines.push({
        name: `${splitDay.label} — ${dayName}`,
        description: goalParams.description,
        goal,
        difficulty,
        estimated_duration_min: duration,
        warmup_notes: getWarmupNotes(splitDay),
        cooldown_notes: '5 minutos de estiramientos estáticos de los músculos trabajados. Mantén cada estiramiento 30 segundos.',
        day_label: dayName,
        exercises: dayExercises,
      })
    }

    return routines
  },

  /** Save a generated routine to the database */
  async save(userId: number, routine: GeneratedRoutine): Promise<number> {
    const [result] = await pool.query<any>(
      `INSERT INTO routines (user_id, name, description, goal, difficulty,
                             estimated_duration_min, warmup_notes, cooldown_notes, is_public)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, false)`,
      [userId, routine.name, routine.description, routine.goal, routine.difficulty,
       routine.estimated_duration_min, routine.warmup_notes, routine.cooldown_notes]
    )
    const routineId = result.insertId

    for (const ex of routine.exercises) {
      await pool.query(
        `INSERT INTO routine_exercises
           (routine_id, exercise_id, order_index, sets, reps, duration_seconds, rest_seconds)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [routineId, ex.exercise_id, ex.order_index, ex.sets,
         ex.reps, ex.duration_seconds, ex.rest_seconds]
      )
    }

    return routineId
  },
}

/* ─── Helpers ────────────────────────────────────────────────── */

function pickExercisesForDay(
  pool: ExerciseRow[],
  splitDay: SplitDay,
  params: GoalParams,
  emphasis: string[],
  goal: string,
): GeneratedExercise[] {
  const dayGroups = new Set(splitDay.muscleGroups)

  // Clasificar ejercicios: "primary" si su muscle_group principal encaja,
  // "secondary" si alguno de sus secondary_muscles encaja
  const primaryCandidates: ExerciseRow[] = []
  const secondaryCandidates: ExerciseRow[] = []

  for (const e of pool) {
    if (dayGroups.has(e.muscle_group)) {
      primaryCandidates.push(e)
    } else if (e.secondary_muscles.some(m => dayGroups.has(m))) {
      secondaryCandidates.push(e)
    }
  }

  // Para cardio/fat_loss, incluir también ejercicios cardio/hiit
  if (goal === 'cardio_endurance' || goal === 'fat_loss') {
    for (const e of pool) {
      if ((e.category === 'cardio' || e.category === 'hiit') &&
          !primaryCandidates.some(c => c.id === e.id)) {
        primaryCandidates.push(e)
      }
    }
  }

  // Agrupar candidatos por grupo muscular para selección aleatoria real
  const primaryByGroup = new Map<string, ExerciseRow[]>()
  for (const e of primaryCandidates) {
    const groups = [e.muscle_group, ...e.secondary_muscles.filter(m => dayGroups.has(m))]
    for (const g of groups) {
      if (!primaryByGroup.has(g)) primaryByGroup.set(g, [])
      primaryByGroup.get(g)!.push(e)
    }
  }

  // Combinar y deduplicar todo el pool disponible
  const allCandidates = [...primaryCandidates, ...secondaryCandidates]
  const seen = new Set<number>()
  const unique = allCandidates.filter(e => {
    if (seen.has(e.id)) return false
    seen.add(e.id)
    return true
  })

  if (unique.length === 0) return []

  const selected: ExerciseRow[] = []
  const usedIds = new Set<number>()

  // Primero: un ejercicio ALEATORIO por cada grupo muscular del día
  // Shuffle los grupos para que no siempre se prioricen los mismos
  const shuffledGroups = shuffle([...splitDay.muscleGroups])

  // Emphasis: dar prioridad a los grupos enfatizados
  shuffledGroups.sort((a, b) => {
    const aEmph = emphasis.includes(a) ? 0 : 1
    const bEmph = emphasis.includes(b) ? 0 : 1
    return aEmph - bEmph
  })

  for (const group of shuffledGroups) {
    if (selected.length >= params.exercisesPerDay) break
    const candidates = (primaryByGroup.get(group) ?? []).filter(e => !usedIds.has(e.id))
    if (candidates.length === 0) continue

    // Elegir uno al azar entre los candidatos de este grupo
    const pick = candidates[Math.floor(Math.random() * candidates.length)]
    selected.push(pick)
    usedIds.add(pick.id)
  }

  // Rellenar con ejercicios aleatorios del pool restante
  const remaining = shuffle(unique.filter(e => !usedIds.has(e.id)))
  for (const e of remaining) {
    if (selected.length >= params.exercisesPerDay) break
    selected.push(e)
    usedIds.add(e.id)
  }

  return selected.map((ex, idx) => {
    const isCardio = ex.category === 'cardio'
    const reps = isCardio ? null : randomInRange(params.repsRange[0], params.repsRange[1])
    const durationSec = isCardio ? randomChoice([120, 180, 300, 600]) : null

    return {
      exercise_id: ex.id,
      exercise_name: ex.name,
      sets: isCardio ? 1 : params.setsPerExercise,
      reps,
      duration_seconds: durationSec,
      rest_seconds: isCardio ? 60 : params.restSeconds,
      order_index: idx + 1,
    }
  })
}

function getWarmupNotes(splitDay: SplitDay): string {
  const isLower = splitDay.muscleGroups.some(g =>
    ['quadriceps', 'hamstrings', 'glutes', 'calves', 'legs'].includes(g)
  )
  const isUpper = splitDay.muscleGroups.some(g =>
    ['chest', 'back', 'lats', 'upper_back', 'shoulders', 'biceps', 'triceps', 'arms'].includes(g)
  )

  const parts = ['5 minutos de cardio ligero (bicicleta, caminata rápida o comba).']
  if (isUpper) parts.push('Rotaciones de hombro, dislocaciones con banda y push-ups ligeros.')
  if (isLower) parts.push('Sentadillas sin peso, zancadas caminando y movilidad de cadera.')
  parts.push('2 series de calentamiento del primer ejercicio con peso ligero.')

  return parts.join('\n')
}

/** Fisher-Yates shuffle — muta el array in-place */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
