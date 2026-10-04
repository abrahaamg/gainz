-- ============================================================
-- 007_indices.sql
-- Índices para las consultas más frecuentes de sesiones, 1RM y progreso
-- Ejecutar en MySQL Workbench: File → Open SQL Script → Execute
-- ============================================================

USE fitness_tracker;

-- MySQL no admite CREATE INDEX IF NOT EXISTS: se usa un procedimiento
-- para que la migración se pueda ejecutar más de una vez sin error.
DROP PROCEDURE IF EXISTS add_indexes_if_missing;

DELIMITER $$
CREATE PROCEDURE add_indexes_if_missing()
BEGIN
  -- Listado de sesiones del usuario, rachas y gráficas por estado y fecha
  IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema='fitness_tracker' AND table_name='sessions' AND index_name='idx_sessions_user_status_started') THEN
    CREATE INDEX idx_sessions_user_status_started ON sessions (user_id, status, started_at);
  END IF;

  -- Proyección de 1RM por usuario y ejercicio en el tiempo
  IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema='fitness_tracker' AND table_name='exercise_1rm_history' AND index_name='idx_1rm_user_exercise_created') THEN
    CREATE INDEX idx_1rm_user_exercise_created ON exercise_1rm_history (user_id, exercise_id, created_at);
  END IF;

  -- Último rendimiento de un ejercicio (Smart Fill)
  IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema='fitness_tracker' AND table_name='session_exercises' AND index_name='idx_session_exercises_exercise_completed') THEN
    CREATE INDEX idx_session_exercises_exercise_completed ON session_exercises (exercise_id, completed_at);
  END IF;
END$$
DELIMITER ;

CALL add_indexes_if_missing();
DROP PROCEDURE IF EXISTS add_indexes_if_missing;
