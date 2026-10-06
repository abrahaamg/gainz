-- ============================================================
-- 007_indices.sql
-- Índices para las consultas más frecuentes de sesiones, 1RM y progreso
--
-- Sin procedimiento almacenado (TiDB no los admite): el runner solo aplica
-- la migración una vez, así que no hace falta comprobar si ya existen.
-- ============================================================

-- Listado de sesiones del usuario, rachas y gráficas por estado y fecha
CREATE INDEX idx_sessions_user_status_started ON sessions (user_id, status, started_at);

-- Proyección de 1RM por usuario y ejercicio en el tiempo
CREATE INDEX idx_1rm_user_exercise_created ON exercise_1rm_history (user_id, exercise_id, created_at);

-- Último rendimiento de un ejercicio (Smart Fill)
CREATE INDEX idx_session_exercises_exercise_completed ON session_exercises (exercise_id, completed_at);
