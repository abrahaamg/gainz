-- ============================================================
-- 010_routine_exercise_set_plan.sql
-- Plan por serie en cada ejercicio de rutina: reps y peso propios de cada
-- serie, p. ej. [{"reps":10,"weight_kg":20},{"reps":9,"weight_kg":20}].
-- NULL = sin plan por serie (rutinas antiguas): todas las series usan
-- reps y weight_suggestion.
-- ============================================================

ALTER TABLE routine_exercises ADD COLUMN set_plan JSON NULL;
