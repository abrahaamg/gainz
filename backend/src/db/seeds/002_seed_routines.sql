-- ============================================================
-- 002_seed_routines.sql
-- Rutinas oficiales de Gainz — públicas, creadas por user_id=1
-- Ejecutar DESPUÉS de 001_seed_exercises.sql y 002_profile_and_equipment_catalog.sql
-- ============================================================

USE fitness_tracker;
SET SQL_SAFE_UPDATES = 0;

-- ─────────────────────────────────────────────────────────────
-- RUTINA 1: Full Body Principiante (solo peso corporal)
-- ─────────────────────────────────────────────────────────────
INSERT INTO routines (user_id, name, description, goal, difficulty, estimated_duration_min, warmup_notes, cooldown_notes, is_public)
VALUES (1, 'Full Body Principiante',
  'Rutina de cuerpo completo sin equipamiento. Ideal para empezar a entrenar desde casa.',
  'general_fitness', 'easy', 45,
  '5 minutos de cardio ligero: jumping jacks, trote en el sitio o saltar a la comba.\nRotaciones articulares de hombro, cadera y tobillo.',
  '5 minutos de estiramientos estáticos. 30 segundos por grupo muscular.',
  true);

SET @r1 = LAST_INSERT_ID();

INSERT INTO routine_exercises (routine_id, exercise_id, order_index, sets, reps, rest_seconds, notes)
SELECT @r1, e.id, v.idx, v.sets, v.reps, v.rest, v.notes FROM exercises e
JOIN (
  SELECT 'Burpees' AS name, 1 AS idx, 3 AS sets, 8 AS reps, 60 AS rest, 'Versión sin flexión si eres principiante' AS notes
  UNION ALL SELECT 'Mountain Climbers', 2, 3, 20, 45, NULL
  UNION ALL SELECT 'Fondos en Paralelas', 3, 3, 10, 60, 'Puedes hacerlos en una silla o banco bajo'
  UNION ALL SELECT 'Dominadas', 4, 3, 5, 90, 'Usa banda elástica si necesitas ayuda'
  UNION ALL SELECT 'Pistol Squat', 5, 3, 6, 75, 'Apóyate en una pared si lo necesitas'
  UNION ALL SELECT 'Cat-Cow', 6, 2, 10, 30, NULL
) v ON e.name = v.name;

-- ─────────────────────────────────────────────────────────────
-- RUTINA 2: Fuerza con Barra (requiere barra, discos, rack)
-- ─────────────────────────────────────────────────────────────
INSERT INTO routines (user_id, name, description, goal, difficulty, estimated_duration_min, warmup_notes, cooldown_notes, is_public)
VALUES (1, 'Fuerza Básica con Barra',
  'Los 5 levantamientos fundamentales. Programa clásico de fuerza tipo Starting Strength.',
  'strength', 'medium', 60,
  '5 minutos de bici o remo.\n2 series de calentamiento progresivo de cada ejercicio con peso ligero.',
  'Estiramientos de cadena posterior, pecho y hombros. 30s cada uno.',
  true);

SET @r2 = LAST_INSERT_ID();

INSERT INTO routine_exercises (routine_id, exercise_id, order_index, sets, reps, rest_seconds, notes)
SELECT @r2, e.id, v.idx, v.sets, v.reps, v.rest, v.notes FROM exercises e
JOIN (
  SELECT 'Sentadilla con Barra' AS name, 1 AS idx, 5 AS sets, 5 AS reps, 180 AS rest, 'Peso progresivo: +2.5 kg cada semana' AS notes
  UNION ALL SELECT 'Press de Banca', 2, 5, 5, 180, 'Alterna con Press Militar cada sesión'
  UNION ALL SELECT 'Peso Muerto', 3, 3, 5, 180, 'Solo 3 series — el peso muerto es muy exigente'
  UNION ALL SELECT 'Remo con Barra', 4, 3, 8, 120, 'Complemento de tracción horizontal'
  UNION ALL SELECT 'Curl de Bíceps con Barra', 5, 3, 10, 60, 'Opcional — trabajo de aislamiento'
) v ON e.name = v.name;

-- ─────────────────────────────────────────────────────────────
-- RUTINA 3: HIIT Express (equipamiento variado)
-- ─────────────────────────────────────────────────────────────
INSERT INTO routines (user_id, name, description, goal, difficulty, estimated_duration_min, warmup_notes, cooldown_notes, is_public)
VALUES (1, 'HIIT Express 30min',
  'Circuito de alta intensidad en 30 minutos. Máxima quema calórica con descansos cortos.',
  'fat_loss', 'hard', 30,
  '3 minutos de trote suave o saltar a la comba.\nMovilidad dinámica de todo el cuerpo.',
  '3 minutos de respiración controlada y estiramientos suaves.',
  true);

SET @r3 = LAST_INSERT_ID();

INSERT INTO routine_exercises (routine_id, exercise_id, order_index, sets, reps, duration_seconds, rest_seconds, notes)
SELECT @r3, e.id, v.idx, v.sets, v.reps, v.dur, v.rest, v.notes FROM exercises e
JOIN (
  SELECT 'Burpees' AS name, 1 AS idx, 4 AS sets, 10 AS reps, NULL AS dur, 30 AS rest, 'Máxima explosividad' AS notes
  UNION ALL SELECT 'Kettlebell Swings', 2, 4, 15, NULL, 30, NULL
  UNION ALL SELECT 'Box Jumps', 3, 4, 10, NULL, 30, 'Baja de un paso, no saltando'
  UNION ALL SELECT 'Battle Ropes', 4, 4, NULL, NULL, 30, 'Ondas alternas 30 segundos'
  UNION ALL SELECT 'Mountain Climbers', 5, 4, 20, NULL, 30, NULL
  UNION ALL SELECT 'Sprints 20 metros', 6, 4, NULL, NULL, 45, 'Sprint ida + vuelta caminando'
) v ON e.name = v.name;

-- Fix Battle Ropes duration (no reps, 30s work)
UPDATE routine_exercises SET duration_seconds = 30, reps = NULL
WHERE routine_id = @r3 AND exercise_id = (SELECT id FROM exercises WHERE name = 'Battle Ropes');

UPDATE routine_exercises SET duration_seconds = 30, reps = NULL
WHERE routine_id = @r3 AND exercise_id = (SELECT id FROM exercises WHERE name = 'Sprints 20 metros');

-- ─────────────────────────────────────────────────────────────
-- RUTINA 4: Glúteos y Piernas (enfocada mujer)
-- ─────────────────────────────────────────────────────────────
INSERT INTO routines (user_id, name, description, goal, difficulty, estimated_duration_min, warmup_notes, cooldown_notes, is_public)
VALUES (1, 'Glúteos y Piernas Intenso',
  'Entrenamiento enfocado en tren inferior: glúteos, cuádriceps e isquiotibiales. Con barra y peso corporal.',
  'glutes_legs', 'medium', 50,
  '5 minutos de bici estática.\nActivación de glúteos: puente de glúteos x15, clamshells x12 por lado.\nSentadillas sin peso x10.',
  'Pigeon Pose 45s por lado.\nEstiramiento de isquiotibiales 30s por pierna.\nEstiramiento de cuádriceps 30s por pierna.',
  true);

SET @r4 = LAST_INSERT_ID();

INSERT INTO routine_exercises (routine_id, exercise_id, order_index, sets, reps, rest_seconds, notes)
SELECT @r4, e.id, v.idx, v.sets, v.reps, v.rest, v.notes FROM exercises e
JOIN (
  SELECT 'Sentadilla con Barra' AS name, 1 AS idx, 4 AS sets, 12 AS reps, 90 AS rest, 'Peso moderado, rango completo de movimiento' AS notes
  UNION ALL SELECT 'Peso Muerto', 2, 4, 10, 90, 'Enfoque en activación de glúteos e isquios'
  UNION ALL SELECT 'Pistol Squat', 3, 3, 8, 75, 'Alternando piernas. Usa apoyo si necesitas'
  UNION ALL SELECT 'Single Leg Deadlift', 4, 3, 10, 60, '10 repeticiones por pierna'
  UNION ALL SELECT 'Box Jumps', 5, 3, 10, 60, 'Pliometría para potencia'
  UNION ALL SELECT 'Hip Flexor Stretch', 6, 2, NULL, 30, 'Mantén 45 segundos por lado'
) v ON e.name = v.name;

-- Fix the Hip Flexor Stretch to use duration
UPDATE routine_exercises SET duration_seconds = 45, reps = NULL
WHERE routine_id = @r4 AND exercise_id = (SELECT id FROM exercises WHERE name = 'Hip Flexor Stretch');

-- ─────────────────────────────────────────────────────────────
-- RUTINA 5: Cardio y Resistencia
-- ─────────────────────────────────────────────────────────────
INSERT INTO routines (user_id, name, description, goal, difficulty, estimated_duration_min, warmup_notes, cooldown_notes, is_public)
VALUES (1, 'Cardio y Resistencia Total',
  'Sesión combinada de cardio y resistencia muscular. Ideal para mejorar la capacidad cardiovascular.',
  'cardio_endurance', 'medium', 45,
  '5 minutos caminando rápido o trote suave.\nMovilidad de tobillos y caderas.',
  '5 minutos caminando. Estiramientos de todo el cuerpo.',
  true);

SET @r5 = LAST_INSERT_ID();

INSERT INTO routine_exercises (routine_id, exercise_id, order_index, sets, reps, duration_seconds, rest_seconds, notes)
SELECT @r5, e.id, v.idx, v.sets, v.reps, v.dur, v.rest, v.notes FROM exercises e
JOIN (
  SELECT 'Carrera en Cinta' AS name, 1 AS idx, 1 AS sets, NULL AS reps, 600 AS dur, 120 AS rest, '10 minutos a ritmo moderado (puedes conversar)' AS notes
  UNION ALL SELECT 'Remo en Ergómetro', 2, 1, NULL, 300, 90, '5 minutos a intensidad media'
  UNION ALL SELECT 'Bicicleta Estática', 3, 1, NULL, 600, 120, '10 minutos con intervalos de resistencia'
  UNION ALL SELECT 'Saltar a la Comba', 4, 3, NULL, 60, 30, '1 minuto saltando, 30s descanso'
  UNION ALL SELECT 'Burpees', 5, 3, 10, NULL, 45, 'Finisher metabólico'
  UNION ALL SELECT 'Estiramiento de Isquiotibiales', 6, 2, NULL, 45, 30, 'Vuelta a la calma'
) v ON e.name = v.name;

SET SQL_SAFE_UPDATES = 1;
