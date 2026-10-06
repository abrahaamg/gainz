-- ============================================================
-- 002_profile_and_equipment_catalog.sql
-- Perfil de usuario ampliado + catálogo de equipamiento
--
-- Los vínculos ejercicio-equipo de los 25 ejercicios base que antes se
-- cargaban aquí viven ahora en el seed 001_seed_exercises.sql: en una BD
-- vacía las migraciones corren antes que los seeds y aquí aún no había
-- ejercicios a los que vincular.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. AMPLIAR TABLA USERS con campos de perfil
--    Sin procedimiento almacenado (TiDB no los admite): el runner solo
--    aplica la migración una vez, así que no hace falta comprobar antes.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN sex VARCHAR(10) DEFAULT NULL AFTER email;
ALTER TABLE users ADD COLUMN age INT DEFAULT NULL AFTER sex;
ALTER TABLE users ADD COLUMN height_cm DECIMAL(5,1) DEFAULT NULL AFTER weight_kg;
ALTER TABLE users ADD COLUMN experience VARCHAR(20) DEFAULT NULL AFTER fitness_level;
ALTER TABLE users ADD COLUMN primary_goal VARCHAR(50) DEFAULT NULL AFTER goals;
ALTER TABLE users ADD COLUMN available_days JSON DEFAULT NULL AFTER primary_goal;
ALTER TABLE users ADD COLUMN session_duration_min INT DEFAULT NULL AFTER available_days;
ALTER TABLE users ADD COLUMN injuries JSON DEFAULT NULL AFTER session_duration_min;
ALTER TABLE users ADD COLUMN onboarding_done BOOLEAN DEFAULT false AFTER injuries;

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
