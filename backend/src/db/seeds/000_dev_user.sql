-- ============================================================
-- 000_dev_user.sql
-- Usuario 1: el de desarrollo (sin auth real) y el dueño de las rutinas
-- oficiales del seed 002. Idempotente (INSERT IGNORE).
-- ============================================================

INSERT IGNORE INTO users (id, username, email, fitness_level, weight_kg)
VALUES (1, 'dev_user', 'dev@test.com', 'intermediate', 75);

INSERT IGNORE INTO streaks (user_id)
VALUES (1);
