-- ============================================================
-- 002_profile_and_equipment_catalog.sql
-- Perfil de usuario ampliado + catálogo de equipamiento + relaciones ejercicio-equipo
-- Ejecutar en MySQL Workbench: File → Open SQL Script → Execute
-- ============================================================

USE fitness_tracker;
SET SQL_SAFE_UPDATES = 0;

-- ─────────────────────────────────────────────────────────────
-- 1. AMPLIAR TABLA USERS con campos de perfil
--    (se usa procedimiento para evitar error si la columna ya existe)
-- ─────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS add_columns_if_missing;

DELIMITER $$
CREATE PROCEDURE add_columns_if_missing()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='fitness_tracker' AND table_name='users' AND column_name='sex') THEN
    ALTER TABLE users ADD COLUMN sex VARCHAR(10) DEFAULT NULL AFTER email;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='fitness_tracker' AND table_name='users' AND column_name='age') THEN
    ALTER TABLE users ADD COLUMN age INT DEFAULT NULL AFTER sex;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='fitness_tracker' AND table_name='users' AND column_name='height_cm') THEN
    ALTER TABLE users ADD COLUMN height_cm DECIMAL(5,1) DEFAULT NULL AFTER weight_kg;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='fitness_tracker' AND table_name='users' AND column_name='experience') THEN
    ALTER TABLE users ADD COLUMN experience VARCHAR(20) DEFAULT NULL AFTER fitness_level;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='fitness_tracker' AND table_name='users' AND column_name='primary_goal') THEN
    ALTER TABLE users ADD COLUMN primary_goal VARCHAR(50) DEFAULT NULL AFTER goals;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='fitness_tracker' AND table_name='users' AND column_name='available_days') THEN
    ALTER TABLE users ADD COLUMN available_days JSON DEFAULT NULL AFTER primary_goal;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='fitness_tracker' AND table_name='users' AND column_name='session_duration_min') THEN
    ALTER TABLE users ADD COLUMN session_duration_min INT DEFAULT NULL AFTER available_days;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='fitness_tracker' AND table_name='users' AND column_name='injuries') THEN
    ALTER TABLE users ADD COLUMN injuries JSON DEFAULT NULL AFTER session_duration_min;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='fitness_tracker' AND table_name='users' AND column_name='onboarding_done') THEN
    ALTER TABLE users ADD COLUMN onboarding_done BOOLEAN DEFAULT false AFTER injuries;
  END IF;
END$$
DELIMITER ;

CALL add_columns_if_missing();
DROP PROCEDURE IF EXISTS add_columns_if_missing;

-- ─────────────────────────────────────────────────────────────
-- 2. CATÁLOGO DE EQUIPAMIENTO
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS equipment_catalog (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(100) NOT NULL UNIQUE,
  category  VARCHAR(30)  NOT NULL,
  icon      VARCHAR(10)  DEFAULT NULL
);

INSERT IGNORE INTO equipment_catalog (name, category) VALUES
  ('Barra olímpica',      'free_weights'),
  ('Mancuernas',          'free_weights'),
  ('Discos',              'free_weights'),
  ('Kettlebell',          'free_weights'),
  ('Barra Z / EZ',        'free_weights'),
  ('Banco plano',         'benches'),
  ('Banco inclinado',     'benches'),
  ('Rack / Jaula',        'benches'),
  ('Multipower / Smith',  'machines'),
  ('Polea alta',          'machines'),
  ('Polea baja',          'machines'),
  ('Prensa de piernas',   'machines'),
  ('Máquina de extensiones', 'machines'),
  ('Máquina de curl femoral', 'machines'),
  ('Cinta de correr',     'cardio'),
  ('Bicicleta estática',  'cardio'),
  ('Remo ergómetro',      'cardio'),
  ('Elíptica',            'cardio'),
  ('Cuerda de saltar',    'accessories'),
  ('Cajón pliométrico',   'accessories'),
  ('Cuerdas de batalla',  'accessories'),
  ('Banda elástica',      'accessories'),
  ('TRX / Anillas',       'accessories'),
  ('Barra de dominadas',  'accessories'),
  ('Ab wheel',            'accessories');

-- ─────────────────────────────────────────────────────────────
-- 3. SEED EXERCISE_EQUIPMENT
-- ─────────────────────────────────────────────────────────────
DELETE FROM exercise_equipment;

INSERT INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra olímpica' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
  UNION ALL SELECT 'Banco plano', false
  UNION ALL SELECT 'Rack / Jaula', true
) eq WHERE e.name = 'Press de Banca';

INSERT INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra olímpica' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
  UNION ALL SELECT 'Rack / Jaula', false
) eq WHERE e.name = 'Sentadilla con Barra';

INSERT INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra olímpica' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
) eq WHERE e.name = 'Peso Muerto';

INSERT INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra de dominadas' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Banda elástica', true
) eq WHERE e.name = 'Dominadas';

INSERT INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra olímpica' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
) eq WHERE e.name = 'Press Militar';

INSERT INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra olímpica' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
) eq WHERE e.name = 'Remo con Barra';

INSERT INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, 'Barra de dominadas', true FROM exercises e
WHERE e.name = 'Fondos en Paralelas';

INSERT INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra olímpica' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
  UNION ALL SELECT 'Barra Z / EZ', true
) eq WHERE e.name = 'Curl de Bíceps con Barra';

INSERT INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, 'Cinta de correr', false FROM exercises e WHERE e.name = 'Carrera en Cinta';

INSERT INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, 'Bicicleta estática', false FROM exercises e WHERE e.name = 'Bicicleta Estática';

INSERT INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, 'Cuerda de saltar', false FROM exercises e WHERE e.name = 'Saltar a la Comba';

INSERT INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, 'Remo ergómetro', false FROM exercises e WHERE e.name = 'Remo en Ergómetro';

INSERT INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, 'Mancuernas', false FROM exercises e WHERE e.name = 'Thrusters con Mancuernas';

INSERT INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, 'Cajón pliométrico', false FROM exercises e WHERE e.name = 'Box Jumps';

INSERT INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, 'Kettlebell', false FROM exercises e WHERE e.name = 'Kettlebell Swings';

INSERT INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, 'Cuerdas de batalla', false FROM exercises e WHERE e.name = 'Battle Ropes';

-- ─────────────────────────────────────────────────────────────
-- 4. ACTUALIZAR requires_equipment
-- ─────────────────────────────────────────────────────────────
UPDATE exercises SET requires_equipment = true WHERE name = 'Saltar a la Comba';
UPDATE exercises SET requires_equipment = true WHERE name = 'Dominadas';
UPDATE exercises SET requires_equipment = true WHERE name = 'Curl de Bíceps con Barra';

SET SQL_SAFE_UPDATES = 1;
