-- ============================================================
-- 003_seed_test_data.sql
-- Datos de prueba completos para ver TODAS las funcionalidades
-- Ejecutar DESPUÉS de todas las migraciones y seeds anteriores
-- ============================================================

USE fitness_tracker;
SET SQL_SAFE_UPDATES = 0;

-- ─────────────────────────────────────────────────────────────
-- 1. ACTUALIZAR USUARIO DEV con perfil completo
-- ─────────────────────────────────────────────────────────────
UPDATE users SET
  username         = 'Abraham',
  email            = 'dev@test.com',
  sex              = 'male',
  age              = 22,
  birth_date       = '2003-09-15',
  weight_kg        = 78.5,
  height_cm        = 180.0,
  fitness_level    = 'intermediate',
  experience       = '1-3',
  primary_goal     = 'hypertrophy',
  available_days   = '["monday","tuesday","thursday","friday"]',
  session_duration_min = 60,
  injuries         = '[]',
  onboarding_done  = true
WHERE id = 1;

-- ─────────────────────────────────────────────────────────────
-- 2. EQUIPAMIENTO DEL USUARIO (variado para recomendaciones)
-- ─────────────────────────────────────────────────────────────
DELETE FROM equipment WHERE user_id = 1;

INSERT INTO equipment (user_id, name, catalog_name, category, quantity, weight_kg, location) VALUES
  (1, 'Barra olímpica',      'Barra olímpica',      'free_weights', 1, 20.0, 'gym'),
  (1, 'Mancuernas',          'Mancuernas',          'free_weights', 2, NULL,  'gym'),
  (1, 'Discos',              'Discos',              'free_weights', 8, NULL,  'gym'),
  (1, 'Banco plano',         'Banco plano',         'benches',      1, NULL,  'gym'),
  (1, 'Banco inclinado',     'Banco inclinado',     'benches',      1, NULL,  'gym'),
  (1, 'Rack / Jaula',        'Rack / Jaula',        'benches',      1, NULL,  'gym'),
  (1, 'Polea alta',          'Polea alta',          'machines',     1, NULL,  'gym'),
  (1, 'Polea baja',          'Polea baja',          'machines',     1, NULL,  'gym'),
  (1, 'Barra de dominadas',  'Barra de dominadas',  'accessories',  1, NULL,  'gym'),
  (1, 'Banda elástica',      'Banda elástica',      'accessories',  2, NULL,  'home'),
  (1, 'Kettlebell',          'Kettlebell',          'free_weights', 1, 16.0, 'home'),
  (1, 'Cuerda de saltar',    'Cuerda de saltar',    'accessories',  1, NULL,  'home');

-- ─────────────────────────────────────────────────────────────
-- 3. SESIONES DE ENTRENAMIENTO (últimos 30 días)
--    Variedad de estados: completed, abandoned, in_progress
-- ─────────────────────────────────────────────────────────────

-- Obtener IDs de rutinas existentes
SET @rutina_fb  = (SELECT id FROM routines WHERE name = 'Full Body Principiante' AND user_id = 1 LIMIT 1);
SET @rutina_str = (SELECT id FROM routines WHERE name = 'Fuerza Básica con Barra' AND user_id = 1 LIMIT 1);
SET @rutina_hiit = (SELECT id FROM routines WHERE name = 'HIIT Express 30min' AND user_id = 1 LIMIT 1);
SET @rutina_legs = (SELECT id FROM routines WHERE name = 'Glúteos y Piernas Intenso' AND user_id = 1 LIMIT 1);
SET @rutina_card = (SELECT id FROM routines WHERE name = 'Cardio y Resistencia Total' AND user_id = 1 LIMIT 1);

-- Sesión 1: Hace 28 días — Fuerza completada
INSERT INTO sessions (user_id, routine_id, started_at, finished_at, duration_seconds, calories_burned, notes, rating, status) VALUES
(1, @rutina_str, DATE_SUB(NOW(), INTERVAL 28 DAY) + INTERVAL 10 HOUR,
                 DATE_SUB(NOW(), INTERVAL 28 DAY) + INTERVAL 11 HOUR + INTERVAL 5 MINUTE,
 3900, 420, 'Primera sesión de fuerza del mes. Me ha costado el peso muerto pero bien en general.', 4, 'completed');
SET @s1 = LAST_INSERT_ID();

-- Sesión 2: Hace 26 días — Full Body completada
INSERT INTO sessions (user_id, routine_id, started_at, finished_at, duration_seconds, calories_burned, notes, rating, status) VALUES
(1, @rutina_fb, DATE_SUB(NOW(), INTERVAL 26 DAY) + INTERVAL 17 HOUR,
                DATE_SUB(NOW(), INTERVAL 26 DAY) + INTERVAL 17 HOUR + INTERVAL 42 MINUTE,
 2520, 310, 'Buen entreno en casa sin material. Las pistol squats aún me cuestan.', 3, 'completed');
SET @s2 = LAST_INSERT_ID();

-- Sesión 3: Hace 24 días — HIIT completada
INSERT INTO sessions (user_id, routine_id, started_at, finished_at, duration_seconds, calories_burned, notes, rating, status) VALUES
(1, @rutina_hiit, DATE_SUB(NOW(), INTERVAL 24 DAY) + INTERVAL 7 HOUR + INTERVAL 30 MINUTE,
                  DATE_SUB(NOW(), INTERVAL 24 DAY) + INTERVAL 8 HOUR,
 1800, 380, 'Brutal pero me ha encantado. Los battle ropes son lo peor.', 5, 'completed');
SET @s3 = LAST_INSERT_ID();

-- Sesión 4: Hace 21 días — Fuerza completada
INSERT INTO sessions (user_id, routine_id, started_at, finished_at, duration_seconds, calories_burned, notes, rating, status) VALUES
(1, @rutina_str, DATE_SUB(NOW(), INTERVAL 21 DAY) + INTERVAL 10 HOUR,
                 DATE_SUB(NOW(), INTERVAL 21 DAY) + INTERVAL 11 HOUR + INTERVAL 10 MINUTE,
 4200, 450, 'He subido 2.5kg en sentadilla. Se nota la progresión.', 5, 'completed');
SET @s4 = LAST_INSERT_ID();

-- Sesión 5: Hace 19 días — Piernas completada
INSERT INTO sessions (user_id, routine_id, started_at, finished_at, duration_seconds, calories_burned, notes, rating, status) VALUES
(1, @rutina_legs, DATE_SUB(NOW(), INTERVAL 19 DAY) + INTERVAL 18 HOUR,
                  DATE_SUB(NOW(), INTERVAL 19 DAY) + INTERVAL 18 HOUR + INTERVAL 50 MINUTE,
 3000, 350, 'Día de piernas duro. Las agujetas van a ser horribles mañana.', 4, 'completed');
SET @s5 = LAST_INSERT_ID();

-- Sesión 6: Hace 17 días — Abandonada (lesión leve)
INSERT INTO sessions (user_id, routine_id, started_at, finished_at, duration_seconds, calories_burned, notes, rating, status) VALUES
(1, @rutina_str, DATE_SUB(NOW(), INTERVAL 17 DAY) + INTERVAL 10 HOUR,
                 DATE_SUB(NOW(), INTERVAL 17 DAY) + INTERVAL 10 HOUR + INTERVAL 15 MINUTE,
 900, 80, 'He sentido una molestia en el hombro derecho al hacer press de banca. He parado por precaución.', 2, 'abandoned');
SET @s6 = LAST_INSERT_ID();

-- Sesión 7: Hace 14 días — Cardio completada
INSERT INTO sessions (user_id, routine_id, started_at, finished_at, duration_seconds, calories_burned, notes, rating, status) VALUES
(1, @rutina_card, DATE_SUB(NOW(), INTERVAL 14 DAY) + INTERVAL 7 HOUR,
                  DATE_SUB(NOW(), INTERVAL 14 DAY) + INTERVAL 7 HOUR + INTERVAL 45 MINUTE,
 2700, 520, 'Sesión de cardio para descansar del hombro. El remo ergómetro me ha gustado mucho.', 4, 'completed');
SET @s7 = LAST_INSERT_ID();

-- Sesión 8: Hace 12 días — Fuerza completada
INSERT INTO sessions (user_id, routine_id, started_at, finished_at, duration_seconds, calories_burned, notes, rating, status) VALUES
(1, @rutina_str, DATE_SUB(NOW(), INTERVAL 12 DAY) + INTERVAL 11 HOUR,
                 DATE_SUB(NOW(), INTERVAL 12 DAY) + INTERVAL 12 HOUR + INTERVAL 8 MINUTE,
 4080, 440, 'Hombro ya bien. He vuelto al peso normal en press de banca sin molestia.', 4, 'completed');
SET @s8 = LAST_INSERT_ID();

-- Sesión 9: Hace 10 días — HIIT completada
INSERT INTO sessions (user_id, routine_id, started_at, finished_at, duration_seconds, calories_burned, notes, rating, status) VALUES
(1, @rutina_hiit, DATE_SUB(NOW(), INTERVAL 10 DAY) + INTERVAL 17 HOUR + INTERVAL 30 MINUTE,
                  DATE_SUB(NOW(), INTERVAL 10 DAY) + INTERVAL 18 HOUR,
 1800, 395, NULL, 4, 'completed');
SET @s9 = LAST_INSERT_ID();

-- Sesión 10: Hace 7 días — Fuerza completada
INSERT INTO sessions (user_id, routine_id, started_at, finished_at, duration_seconds, calories_burned, notes, rating, status) VALUES
(1, @rutina_str, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 10 HOUR,
                 DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 11 HOUR + INTERVAL 12 MINUTE,
 4320, 460, 'Nuevo PR en peso muerto: 120kg x 5. Muy contento.', 5, 'completed');
SET @s10 = LAST_INSERT_ID();

-- Sesión 11: Hace 5 días — Piernas completada
INSERT INTO sessions (user_id, routine_id, started_at, finished_at, duration_seconds, calories_burned, notes, rating, status) VALUES
(1, @rutina_legs, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 18 HOUR,
                  DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 18 HOUR + INTERVAL 48 MINUTE,
 2880, 340, 'He mejorado las pistol squats. Ya puedo hacer 8 por pierna sin apoyo.', 4, 'completed');
SET @s11 = LAST_INSERT_ID();

-- Sesión 12: Hace 3 días — Full Body completada
INSERT INTO sessions (user_id, routine_id, started_at, finished_at, duration_seconds, calories_burned, notes, rating, status) VALUES
(1, @rutina_fb, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 8 HOUR,
                DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 8 HOUR + INTERVAL 40 MINUTE,
 2400, 290, NULL, 3, 'completed');
SET @s12 = LAST_INSERT_ID();

-- Sesión 13: Hace 1 día — Abandonada (falta de tiempo)
INSERT INTO sessions (user_id, routine_id, started_at, finished_at, duration_seconds, calories_burned, notes, rating, status) VALUES
(1, @rutina_hiit, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 13 HOUR,
                  DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 13 HOUR + INTERVAL 12 MINUTE,
 720, 110, 'He tenido que dejarlo a medias por una llamada del trabajo.', 2, 'abandoned');
SET @s13 = LAST_INSERT_ID();

-- Sesión 14: HOY — En curso
INSERT INTO sessions (user_id, routine_id, started_at, finished_at, duration_seconds, calories_burned, notes, rating, status) VALUES
(1, @rutina_str, NOW() - INTERVAL 25 MINUTE, NULL, NULL, NULL, NULL, NULL, 'in_progress');
SET @s14 = LAST_INSERT_ID();

-- Actualizar times_completed de las rutinas
UPDATE routines SET times_completed = 4 WHERE id = @rutina_str;
UPDATE routines SET times_completed = 2 WHERE id = @rutina_fb;
UPDATE routines SET times_completed = 2 WHERE id = @rutina_hiit;
UPDATE routines SET times_completed = 2 WHERE id = @rutina_legs;
UPDATE routines SET times_completed = 1 WHERE id = @rutina_card;

-- ─────────────────────────────────────────────────────────────
-- 4. SESSION_EXERCISES (series detalladas por sesión)
--    Cubrir varias sesiones para que se vea progreso
-- ─────────────────────────────────────────────────────────────

-- IDs de ejercicios
SET @ex_bench   = (SELECT id FROM exercises WHERE name = 'Press de Banca' LIMIT 1);
SET @ex_squat   = (SELECT id FROM exercises WHERE name = 'Sentadilla con Barra' LIMIT 1);
SET @ex_dead    = (SELECT id FROM exercises WHERE name = 'Peso Muerto' LIMIT 1);
SET @ex_row     = (SELECT id FROM exercises WHERE name = 'Remo con Barra' LIMIT 1);
SET @ex_curl    = (SELECT id FROM exercises WHERE name = 'Curl de Bíceps con Barra' LIMIT 1);
SET @ex_pullup  = (SELECT id FROM exercises WHERE name = 'Dominadas' LIMIT 1);
SET @ex_dip     = (SELECT id FROM exercises WHERE name = 'Fondos en Paralelas' LIMIT 1);
SET @ex_ohp     = (SELECT id FROM exercises WHERE name = 'Press Militar' LIMIT 1);
SET @ex_burpee  = (SELECT id FROM exercises WHERE name = 'Burpees' LIMIT 1);
SET @ex_mc      = (SELECT id FROM exercises WHERE name = 'Mountain Climbers' LIMIT 1);
SET @ex_pistol  = (SELECT id FROM exercises WHERE name = 'Pistol Squat' LIMIT 1);
SET @ex_sldl    = (SELECT id FROM exercises WHERE name = 'Single Leg Deadlift' LIMIT 1);
SET @ex_kb      = (SELECT id FROM exercises WHERE name = 'Kettlebell Swings' LIMIT 1);

-- ── Sesión 1 (Fuerza, hace 28 días) ──
INSERT INTO session_exercises (session_id, exercise_id, set_number, reps_done, weight_kg, rpe, completed, completed_at) VALUES
(@s1, @ex_squat, 1, 5, 80.0,  7, true, DATE_SUB(NOW(), INTERVAL 28 DAY) + INTERVAL 10 HOUR + INTERVAL 8 MINUTE),
(@s1, @ex_squat, 2, 5, 80.0,  7, true, DATE_SUB(NOW(), INTERVAL 28 DAY) + INTERVAL 10 HOUR + INTERVAL 12 MINUTE),
(@s1, @ex_squat, 3, 5, 80.0,  8, true, DATE_SUB(NOW(), INTERVAL 28 DAY) + INTERVAL 10 HOUR + INTERVAL 16 MINUTE),
(@s1, @ex_squat, 4, 5, 80.0,  8, true, DATE_SUB(NOW(), INTERVAL 28 DAY) + INTERVAL 10 HOUR + INTERVAL 20 MINUTE),
(@s1, @ex_squat, 5, 5, 80.0,  9, true, DATE_SUB(NOW(), INTERVAL 28 DAY) + INTERVAL 10 HOUR + INTERVAL 24 MINUTE),
(@s1, @ex_bench, 1, 5, 60.0,  6, true, DATE_SUB(NOW(), INTERVAL 28 DAY) + INTERVAL 10 HOUR + INTERVAL 30 MINUTE),
(@s1, @ex_bench, 2, 5, 60.0,  7, true, DATE_SUB(NOW(), INTERVAL 28 DAY) + INTERVAL 10 HOUR + INTERVAL 34 MINUTE),
(@s1, @ex_bench, 3, 5, 60.0,  7, true, DATE_SUB(NOW(), INTERVAL 28 DAY) + INTERVAL 10 HOUR + INTERVAL 38 MINUTE),
(@s1, @ex_bench, 4, 5, 60.0,  8, true, DATE_SUB(NOW(), INTERVAL 28 DAY) + INTERVAL 10 HOUR + INTERVAL 42 MINUTE),
(@s1, @ex_bench, 5, 5, 60.0,  8, true, DATE_SUB(NOW(), INTERVAL 28 DAY) + INTERVAL 10 HOUR + INTERVAL 46 MINUTE),
(@s1, @ex_dead,  1, 5, 100.0, 7, true, DATE_SUB(NOW(), INTERVAL 28 DAY) + INTERVAL 10 HOUR + INTERVAL 52 MINUTE),
(@s1, @ex_dead,  2, 5, 100.0, 8, true, DATE_SUB(NOW(), INTERVAL 28 DAY) + INTERVAL 10 HOUR + INTERVAL 56 MINUTE),
(@s1, @ex_dead,  3, 5, 100.0, 9, true, DATE_SUB(NOW(), INTERVAL 28 DAY) + INTERVAL 11 HOUR),
(@s1, @ex_row,   1, 8, 50.0,  7, true, DATE_SUB(NOW(), INTERVAL 28 DAY) + INTERVAL 11 HOUR + INTERVAL 2 MINUTE),
(@s1, @ex_row,   2, 8, 50.0,  7, true, DATE_SUB(NOW(), INTERVAL 28 DAY) + INTERVAL 11 HOUR + INTERVAL 4 MINUTE);

-- ── Sesión 4 (Fuerza, hace 21 días — progresión +2.5kg squat) ──
INSERT INTO session_exercises (session_id, exercise_id, set_number, reps_done, weight_kg, rpe, completed, completed_at) VALUES
(@s4, @ex_squat, 1, 5, 82.5,  7, true, DATE_SUB(NOW(), INTERVAL 21 DAY) + INTERVAL 10 HOUR + INTERVAL 8 MINUTE),
(@s4, @ex_squat, 2, 5, 82.5,  7, true, DATE_SUB(NOW(), INTERVAL 21 DAY) + INTERVAL 10 HOUR + INTERVAL 12 MINUTE),
(@s4, @ex_squat, 3, 5, 82.5,  8, true, DATE_SUB(NOW(), INTERVAL 21 DAY) + INTERVAL 10 HOUR + INTERVAL 16 MINUTE),
(@s4, @ex_squat, 4, 5, 82.5,  8, true, DATE_SUB(NOW(), INTERVAL 21 DAY) + INTERVAL 10 HOUR + INTERVAL 20 MINUTE),
(@s4, @ex_squat, 5, 5, 82.5,  9, true, DATE_SUB(NOW(), INTERVAL 21 DAY) + INTERVAL 10 HOUR + INTERVAL 24 MINUTE),
(@s4, @ex_bench, 1, 5, 62.5,  7, true, DATE_SUB(NOW(), INTERVAL 21 DAY) + INTERVAL 10 HOUR + INTERVAL 30 MINUTE),
(@s4, @ex_bench, 2, 5, 62.5,  7, true, DATE_SUB(NOW(), INTERVAL 21 DAY) + INTERVAL 10 HOUR + INTERVAL 34 MINUTE),
(@s4, @ex_bench, 3, 5, 62.5,  8, true, DATE_SUB(NOW(), INTERVAL 21 DAY) + INTERVAL 10 HOUR + INTERVAL 38 MINUTE),
(@s4, @ex_bench, 4, 5, 62.5,  8, true, DATE_SUB(NOW(), INTERVAL 21 DAY) + INTERVAL 10 HOUR + INTERVAL 42 MINUTE),
(@s4, @ex_bench, 5, 4, 62.5,  10, true, DATE_SUB(NOW(), INTERVAL 21 DAY) + INTERVAL 10 HOUR + INTERVAL 46 MINUTE),
(@s4, @ex_dead,  1, 5, 105.0, 7, true, DATE_SUB(NOW(), INTERVAL 21 DAY) + INTERVAL 10 HOUR + INTERVAL 52 MINUTE),
(@s4, @ex_dead,  2, 5, 105.0, 8, true, DATE_SUB(NOW(), INTERVAL 21 DAY) + INTERVAL 10 HOUR + INTERVAL 56 MINUTE),
(@s4, @ex_dead,  3, 5, 105.0, 9, true, DATE_SUB(NOW(), INTERVAL 21 DAY) + INTERVAL 11 HOUR),
(@s4, @ex_row,   1, 8, 52.5,  7, true, DATE_SUB(NOW(), INTERVAL 21 DAY) + INTERVAL 11 HOUR + INTERVAL 3 MINUTE),
(@s4, @ex_row,   2, 8, 52.5,  8, true, DATE_SUB(NOW(), INTERVAL 21 DAY) + INTERVAL 11 HOUR + INTERVAL 5 MINUTE),
(@s4, @ex_curl,  1, 10, 30.0, 6, true, DATE_SUB(NOW(), INTERVAL 21 DAY) + INTERVAL 11 HOUR + INTERVAL 7 MINUTE),
(@s4, @ex_curl,  2, 10, 30.0, 7, true, DATE_SUB(NOW(), INTERVAL 21 DAY) + INTERVAL 11 HOUR + INTERVAL 9 MINUTE);

-- ── Sesión 8 (Fuerza, hace 12 días — más progresión) ──
INSERT INTO session_exercises (session_id, exercise_id, set_number, reps_done, weight_kg, rpe, completed, completed_at) VALUES
(@s8, @ex_squat, 1, 5, 85.0,  7, true, DATE_SUB(NOW(), INTERVAL 12 DAY) + INTERVAL 11 HOUR + INTERVAL 8 MINUTE),
(@s8, @ex_squat, 2, 5, 85.0,  8, true, DATE_SUB(NOW(), INTERVAL 12 DAY) + INTERVAL 11 HOUR + INTERVAL 12 MINUTE),
(@s8, @ex_squat, 3, 5, 85.0,  8, true, DATE_SUB(NOW(), INTERVAL 12 DAY) + INTERVAL 11 HOUR + INTERVAL 16 MINUTE),
(@s8, @ex_squat, 4, 5, 85.0,  9, true, DATE_SUB(NOW(), INTERVAL 12 DAY) + INTERVAL 11 HOUR + INTERVAL 20 MINUTE),
(@s8, @ex_squat, 5, 4, 85.0,  10, true, DATE_SUB(NOW(), INTERVAL 12 DAY) + INTERVAL 11 HOUR + INTERVAL 24 MINUTE),
(@s8, @ex_bench, 1, 5, 65.0,  7, true, DATE_SUB(NOW(), INTERVAL 12 DAY) + INTERVAL 11 HOUR + INTERVAL 30 MINUTE),
(@s8, @ex_bench, 2, 5, 65.0,  7, true, DATE_SUB(NOW(), INTERVAL 12 DAY) + INTERVAL 11 HOUR + INTERVAL 34 MINUTE),
(@s8, @ex_bench, 3, 5, 65.0,  8, true, DATE_SUB(NOW(), INTERVAL 12 DAY) + INTERVAL 11 HOUR + INTERVAL 38 MINUTE),
(@s8, @ex_bench, 4, 5, 65.0,  9, true, DATE_SUB(NOW(), INTERVAL 12 DAY) + INTERVAL 11 HOUR + INTERVAL 42 MINUTE),
(@s8, @ex_bench, 5, 4, 65.0,  10, true, DATE_SUB(NOW(), INTERVAL 12 DAY) + INTERVAL 11 HOUR + INTERVAL 46 MINUTE),
(@s8, @ex_dead,  1, 5, 110.0, 7, true, DATE_SUB(NOW(), INTERVAL 12 DAY) + INTERVAL 11 HOUR + INTERVAL 52 MINUTE),
(@s8, @ex_dead,  2, 5, 110.0, 8, true, DATE_SUB(NOW(), INTERVAL 12 DAY) + INTERVAL 11 HOUR + INTERVAL 56 MINUTE),
(@s8, @ex_dead,  3, 5, 110.0, 9, true, DATE_SUB(NOW(), INTERVAL 12 DAY) + INTERVAL 12 HOUR),
(@s8, @ex_row,   1, 8, 55.0,  7, true, DATE_SUB(NOW(), INTERVAL 12 DAY) + INTERVAL 12 HOUR + INTERVAL 3 MINUTE),
(@s8, @ex_row,   2, 8, 55.0,  8, true, DATE_SUB(NOW(), INTERVAL 12 DAY) + INTERVAL 12 HOUR + INTERVAL 5 MINUTE),
(@s8, @ex_curl,  1, 10, 32.5, 7, true, DATE_SUB(NOW(), INTERVAL 12 DAY) + INTERVAL 12 HOUR + INTERVAL 7 MINUTE),
(@s8, @ex_curl,  2, 10, 32.5, 8, true, DATE_SUB(NOW(), INTERVAL 12 DAY) + INTERVAL 12 HOUR + INTERVAL 9 MINUTE);

-- ── Sesión 10 (Fuerza, hace 7 días — PR en peso muerto) ──
INSERT INTO session_exercises (session_id, exercise_id, set_number, reps_done, weight_kg, rpe, completed, completed_at) VALUES
(@s10, @ex_squat, 1, 5, 85.0,  7, true, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 10 HOUR + INTERVAL 8 MINUTE),
(@s10, @ex_squat, 2, 5, 85.0,  8, true, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 10 HOUR + INTERVAL 12 MINUTE),
(@s10, @ex_squat, 3, 5, 87.5,  8, true, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 10 HOUR + INTERVAL 16 MINUTE),
(@s10, @ex_squat, 4, 5, 87.5,  9, true, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 10 HOUR + INTERVAL 20 MINUTE),
(@s10, @ex_squat, 5, 5, 87.5,  9, true, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 10 HOUR + INTERVAL 24 MINUTE),
(@s10, @ex_bench, 1, 5, 65.0,  7, true, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 10 HOUR + INTERVAL 30 MINUTE),
(@s10, @ex_bench, 2, 5, 65.0,  7, true, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 10 HOUR + INTERVAL 34 MINUTE),
(@s10, @ex_bench, 3, 5, 67.5,  8, true, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 10 HOUR + INTERVAL 38 MINUTE),
(@s10, @ex_bench, 4, 5, 67.5,  8, true, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 10 HOUR + INTERVAL 42 MINUTE),
(@s10, @ex_bench, 5, 5, 67.5,  9, true, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 10 HOUR + INTERVAL 46 MINUTE),
(@s10, @ex_dead,  1, 5, 115.0, 7, true, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 10 HOUR + INTERVAL 52 MINUTE),
(@s10, @ex_dead,  2, 5, 115.0, 8, true, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 10 HOUR + INTERVAL 56 MINUTE),
(@s10, @ex_dead,  3, 5, 120.0, 10, true, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 11 HOUR),
(@s10, @ex_row,   1, 8, 57.5,  7, true, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 11 HOUR + INTERVAL 4 MINUTE),
(@s10, @ex_row,   2, 8, 57.5,  8, true, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 11 HOUR + INTERVAL 6 MINUTE),
(@s10, @ex_row,   3, 8, 57.5,  9, true, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 11 HOUR + INTERVAL 8 MINUTE),
(@s10, @ex_curl,  1, 10, 32.5, 6, true, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 11 HOUR + INTERVAL 10 MINUTE),
(@s10, @ex_curl,  2, 10, 32.5, 7, true, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 11 HOUR + INTERVAL 11 MINUTE),
(@s10, @ex_curl,  3, 10, 32.5, 8, true, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 11 HOUR + INTERVAL 12 MINUTE);

-- ── Sesión 5 (Piernas, hace 19 días) ──
INSERT INTO session_exercises (session_id, exercise_id, set_number, reps_done, weight_kg, rpe, completed, completed_at) VALUES
(@s5, @ex_squat, 1, 12, 60.0,  6, true, DATE_SUB(NOW(), INTERVAL 19 DAY) + INTERVAL 18 HOUR + INTERVAL 8 MINUTE),
(@s5, @ex_squat, 2, 12, 60.0,  7, true, DATE_SUB(NOW(), INTERVAL 19 DAY) + INTERVAL 18 HOUR + INTERVAL 12 MINUTE),
(@s5, @ex_squat, 3, 12, 60.0,  8, true, DATE_SUB(NOW(), INTERVAL 19 DAY) + INTERVAL 18 HOUR + INTERVAL 16 MINUTE),
(@s5, @ex_squat, 4, 10, 60.0,  9, true, DATE_SUB(NOW(), INTERVAL 19 DAY) + INTERVAL 18 HOUR + INTERVAL 20 MINUTE),
(@s5, @ex_dead,  1, 10, 80.0,  7, true, DATE_SUB(NOW(), INTERVAL 19 DAY) + INTERVAL 18 HOUR + INTERVAL 25 MINUTE),
(@s5, @ex_dead,  2, 10, 80.0,  8, true, DATE_SUB(NOW(), INTERVAL 19 DAY) + INTERVAL 18 HOUR + INTERVAL 29 MINUTE),
(@s5, @ex_dead,  3, 10, 80.0,  8, true, DATE_SUB(NOW(), INTERVAL 19 DAY) + INTERVAL 18 HOUR + INTERVAL 33 MINUTE),
(@s5, @ex_dead,  4, 8, 80.0,   9, true, DATE_SUB(NOW(), INTERVAL 19 DAY) + INTERVAL 18 HOUR + INTERVAL 37 MINUTE),
(@s5, @ex_pistol, 1, 6, NULL,  8, true, DATE_SUB(NOW(), INTERVAL 19 DAY) + INTERVAL 18 HOUR + INTERVAL 40 MINUTE),
(@s5, @ex_pistol, 2, 6, NULL,  9, true, DATE_SUB(NOW(), INTERVAL 19 DAY) + INTERVAL 18 HOUR + INTERVAL 43 MINUTE),
(@s5, @ex_sldl,  1, 10, NULL,  7, true, DATE_SUB(NOW(), INTERVAL 19 DAY) + INTERVAL 18 HOUR + INTERVAL 46 MINUTE),
(@s5, @ex_sldl,  2, 10, NULL,  7, true, DATE_SUB(NOW(), INTERVAL 19 DAY) + INTERVAL 18 HOUR + INTERVAL 48 MINUTE);

-- ── Sesión 2 (Full Body, hace 26 días) ──
INSERT INTO session_exercises (session_id, exercise_id, set_number, reps_done, weight_kg, rpe, completed, completed_at) VALUES
(@s2, @ex_burpee, 1, 8, NULL, 7, true, DATE_SUB(NOW(), INTERVAL 26 DAY) + INTERVAL 17 HOUR + INTERVAL 5 MINUTE),
(@s2, @ex_burpee, 2, 8, NULL, 8, true, DATE_SUB(NOW(), INTERVAL 26 DAY) + INTERVAL 17 HOUR + INTERVAL 8 MINUTE),
(@s2, @ex_burpee, 3, 7, NULL, 9, true, DATE_SUB(NOW(), INTERVAL 26 DAY) + INTERVAL 17 HOUR + INTERVAL 11 MINUTE),
(@s2, @ex_mc,     1, 20, NULL, 6, true, DATE_SUB(NOW(), INTERVAL 26 DAY) + INTERVAL 17 HOUR + INTERVAL 14 MINUTE),
(@s2, @ex_mc,     2, 20, NULL, 7, true, DATE_SUB(NOW(), INTERVAL 26 DAY) + INTERVAL 17 HOUR + INTERVAL 17 MINUTE),
(@s2, @ex_dip,    1, 10, NULL, 7, true, DATE_SUB(NOW(), INTERVAL 26 DAY) + INTERVAL 17 HOUR + INTERVAL 21 MINUTE),
(@s2, @ex_dip,    2, 8,  NULL, 8, true, DATE_SUB(NOW(), INTERVAL 26 DAY) + INTERVAL 17 HOUR + INTERVAL 24 MINUTE),
(@s2, @ex_pullup, 1, 5,  NULL, 8, true, DATE_SUB(NOW(), INTERVAL 26 DAY) + INTERVAL 17 HOUR + INTERVAL 28 MINUTE),
(@s2, @ex_pullup, 2, 4,  NULL, 9, true, DATE_SUB(NOW(), INTERVAL 26 DAY) + INTERVAL 17 HOUR + INTERVAL 32 MINUTE),
(@s2, @ex_pistol, 1, 5,  NULL, 9, true, DATE_SUB(NOW(), INTERVAL 26 DAY) + INTERVAL 17 HOUR + INTERVAL 36 MINUTE),
(@s2, @ex_pistol, 2, 4,  NULL, 10, true, DATE_SUB(NOW(), INTERVAL 26 DAY) + INTERVAL 17 HOUR + INTERVAL 39 MINUTE);

-- ── Sesión 6 (Abandonada, solo hizo un poco de press) ──
INSERT INTO session_exercises (session_id, exercise_id, set_number, reps_done, weight_kg, rpe, completed, completed_at) VALUES
(@s6, @ex_bench, 1, 5, 62.5, 7, true, DATE_SUB(NOW(), INTERVAL 17 DAY) + INTERVAL 10 HOUR + INTERVAL 8 MINUTE),
(@s6, @ex_bench, 2, 3, 62.5, 9, false, DATE_SUB(NOW(), INTERVAL 17 DAY) + INTERVAL 10 HOUR + INTERVAL 12 MINUTE);

-- ─────────────────────────────────────────────────────────────
-- 5. STREAKS — datos realistas
-- ─────────────────────────────────────────────────────────────
UPDATE streaks SET
  current_streak    = 3,
  longest_streak    = 5,
  last_workout_date = CURDATE() - INTERVAL 1 DAY,
  total_workouts    = 12,
  total_minutes     = ROUND((3900+2520+1800+4200+3000+2700+4080+1800+4320+2880+2400+720) / 60)
WHERE user_id = 1;

-- ─────────────────────────────────────────────────────────────
-- 6. PERSONAL RECORDS
-- ─────────────────────────────────────────────────────────────
DELETE FROM personal_records WHERE user_id = 1;

INSERT INTO personal_records (user_id, exercise_id, record_type, value, achieved_at, session_id) VALUES
(1, @ex_dead,   'max_weight', 120.0, DATE_SUB(NOW(), INTERVAL 7 DAY),  @s10),
(1, @ex_squat,  'max_weight', 87.5,  DATE_SUB(NOW(), INTERVAL 7 DAY),  @s10),
(1, @ex_bench,  'max_weight', 67.5,  DATE_SUB(NOW(), INTERVAL 7 DAY),  @s10),
(1, @ex_row,    'max_weight', 57.5,  DATE_SUB(NOW(), INTERVAL 7 DAY),  @s10),
(1, @ex_curl,   'max_weight', 32.5,  DATE_SUB(NOW(), INTERVAL 12 DAY), @s8),
(1, @ex_pullup, 'max_reps',   5.0,   DATE_SUB(NOW(), INTERVAL 26 DAY), @s2),
(1, @ex_dip,    'max_reps',   10.0,  DATE_SUB(NOW(), INTERVAL 26 DAY), @s2),
(1, @ex_pistol, 'max_reps',   8.0,   DATE_SUB(NOW(), INTERVAL 5 DAY),  @s11),
(1, @ex_burpee, 'max_reps',   10.0,  DATE_SUB(NOW(), INTERVAL 24 DAY), @s3);

-- ─────────────────────────────────────────────────────────────
-- 7. HISTORIAL DE 1RM ESTIMADO (para gráfica de progresión)
--    Fórmula Epley: 1RM = peso × (1 + reps/30)
--    Bench: 60×5→70, 62.5×5→72.9, 65×5→75.8, 67.5×5→78.75
--    Squat: 80×5→93.3, 82.5×5→96.25, 85×5→99.2, 87.5×5→102.1
--    Dead:  100×5→116.7, 105×5→122.5, 110×5→128.3, 120×5→140
-- ─────────────────────────────────────────────────────────────
DELETE FROM exercise_1rm_history WHERE user_id = 1;

INSERT INTO exercise_1rm_history (user_id, exercise_id, estimated_1rm, weight_used, reps_done, session_id, created_at) VALUES
-- Press de Banca progresión
(1, @ex_bench, 70.00,  60.0,  5, @s1,  DATE_SUB(NOW(), INTERVAL 28 DAY)),
(1, @ex_bench, 72.92,  62.5,  5, @s4,  DATE_SUB(NOW(), INTERVAL 21 DAY)),
(1, @ex_bench, 75.83,  65.0,  5, @s8,  DATE_SUB(NOW(), INTERVAL 12 DAY)),
(1, @ex_bench, 78.75,  67.5,  5, @s10, DATE_SUB(NOW(), INTERVAL 7 DAY)),

-- Sentadilla progresión
(1, @ex_squat, 93.33,  80.0,  5, @s1,  DATE_SUB(NOW(), INTERVAL 28 DAY)),
(1, @ex_squat, 96.25,  82.5,  5, @s4,  DATE_SUB(NOW(), INTERVAL 21 DAY)),
(1, @ex_squat, 99.17,  85.0,  5, @s8,  DATE_SUB(NOW(), INTERVAL 12 DAY)),
(1, @ex_squat, 102.08, 87.5,  5, @s10, DATE_SUB(NOW(), INTERVAL 7 DAY)),

-- Peso Muerto progresión
(1, @ex_dead, 116.67, 100.0, 5, @s1,  DATE_SUB(NOW(), INTERVAL 28 DAY)),
(1, @ex_dead, 122.50, 105.0, 5, @s4,  DATE_SUB(NOW(), INTERVAL 21 DAY)),
(1, @ex_dead, 128.33, 110.0, 5, @s8,  DATE_SUB(NOW(), INTERVAL 12 DAY)),
(1, @ex_dead, 140.00, 120.0, 5, @s10, DATE_SUB(NOW(), INTERVAL 7 DAY)),

-- Remo progresión
(1, @ex_row, 63.33, 50.0, 8, @s1,  DATE_SUB(NOW(), INTERVAL 28 DAY)),
(1, @ex_row, 66.50, 52.5, 8, @s4,  DATE_SUB(NOW(), INTERVAL 21 DAY)),
(1, @ex_row, 69.67, 55.0, 8, @s8,  DATE_SUB(NOW(), INTERVAL 12 DAY)),
(1, @ex_row, 72.83, 57.5, 8, @s10, DATE_SUB(NOW(), INTERVAL 7 DAY));

SET SQL_SAFE_UPDATES = 1;

-- ¡Listo! Datos de prueba insertados.
-- Funcionalidades que se pueden probar:
--   ✓ Dashboard: gráfica de actividad 30 días, racha, stats
--   ✓ Historial: 14 sesiones (12 completed, 2 abandoned, 1 in_progress)
--   ✓ Progreso: gráficas de volumen, frecuencia, 1RM, records
--   ✓ Perfil: datos completos con fecha nacimiento e IMC
--   ✓ Equipamiento: 12 items de equipo
--   ✓ Recomendaciones: generará rutinas basadas en perfil + equipo
--   ✓ Sesiones: series detalladas con RPE y progresión de peso
--   ✓ Smart Fill: al iniciar sesión nueva, auto-completará últimos pesos
--   ✓ Sobrecarga progresiva: series con RPE ≤ 7 mostrarán sugerencia de subir peso
