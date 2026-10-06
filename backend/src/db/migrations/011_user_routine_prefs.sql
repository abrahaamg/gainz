-- ============================================================
-- 011_user_routine_prefs.sql
-- Preferencias de cada usuario sobre las rutinas que ve en su lista
-- (propias, oficiales o públicas de otros):
--   position: orden manual en su lista (0 = arriba). NULL = sin colocar;
--             esas salen primero, las más nuevas arriba.
--   hidden:   la ha quitado de su lista (solo rutinas ajenas; no la borra).
-- La rutina es de todos; el orden y el ocultado son de cada usuario.
-- ============================================================

CREATE TABLE IF NOT EXISTS user_routine_prefs (
  user_id    INT       NOT NULL,
  routine_id INT       NOT NULL,
  position   INT       NULL,
  hidden     BOOLEAN   NOT NULL DEFAULT false,
  hidden_at  TIMESTAMP NULL,
  PRIMARY KEY (user_id, routine_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE
);
