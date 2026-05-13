-- ============================================================
-- LIMPIEZA: Borra ejercicios duplicados conservando el ID más alto.
-- Antes redirige las rutinas y otros datos a los IDs nuevos para
-- no perder nada.
-- Ejecutar ANTES de re-correr la sección de equipment links del 004.
-- ============================================================

USE fitness_tracker;
SET SQL_SAFE_UPDATES = 0;

-- ─── PASO 1: Redirigir routine_exercises a los IDs nuevos ────
-- Para cada routine_exercise que apunte a un ID viejo, lo cambiamos
-- al ID más alto del mismo nombre (que es el insertado hoy).
UPDATE routine_exercises re
JOIN exercises e_old ON e_old.id = re.exercise_id
JOIN (
  SELECT name, MAX(id) AS new_id
  FROM exercises
  WHERE created_by IS NULL
  GROUP BY name
) e_new ON e_new.name = e_old.name
SET re.exercise_id = e_new.new_id
WHERE e_old.id < e_new.new_id
  AND e_old.created_by IS NULL;

-- ─── PASO 2: Redirigir session_exercises a los IDs nuevos ────
UPDATE session_exercises se
JOIN exercises e_old ON e_old.id = se.exercise_id
JOIN (
  SELECT name, MAX(id) AS new_id
  FROM exercises
  WHERE created_by IS NULL
  GROUP BY name
) e_new ON e_new.name = e_old.name
SET se.exercise_id = e_new.new_id
WHERE e_old.id < e_new.new_id
  AND e_old.created_by IS NULL;

-- ─── PASO 3: Redirigir personal_records si existen ───────────
UPDATE personal_records pr
JOIN exercises e_old ON e_old.id = pr.exercise_id
JOIN (
  SELECT name, MAX(id) AS new_id
  FROM exercises
  WHERE created_by IS NULL
  GROUP BY name
) e_new ON e_new.name = e_old.name
SET pr.exercise_id = e_new.new_id
WHERE e_old.id < e_new.new_id
  AND e_old.created_by IS NULL;

-- ─── PASO 4: Redirigir exercise_1rm_history si existe ────────
UPDATE exercise_1rm_history h
JOIN exercises e_old ON e_old.id = h.exercise_id
JOIN (
  SELECT name, MAX(id) AS new_id
  FROM exercises
  WHERE created_by IS NULL
  GROUP BY name
) e_new ON e_new.name = e_old.name
SET h.exercise_id = e_new.new_id
WHERE e_old.id < e_new.new_id
  AND e_old.created_by IS NULL;

-- ─── PASO 5: Borrar los ejercicios viejos duplicados ─────────
-- Ya nada los referencia (acabamos de redirigir todo).
DELETE e1 FROM exercises e1
INNER JOIN exercises e2
  ON e1.name = e2.name
  AND e1.id < e2.id
WHERE e1.created_by IS NULL
  AND e2.created_by IS NULL;

SET SQL_SAFE_UPDATES = 1;

-- ─── VERIFICACIÓN: debe devolver 0 filas ─────────────────────
SELECT name, COUNT(*) AS num_copias
FROM exercises
WHERE created_by IS NULL
GROUP BY name
HAVING COUNT(*) > 1;
