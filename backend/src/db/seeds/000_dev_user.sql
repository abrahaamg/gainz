-- ============================================================
-- 000_dev_user.sql
-- Usuario de desarrollo para módulos 0-6 (sin auth real)
-- ============================================================

USE fitness_tracker;

INSERT IGNORE INTO users (id, username, email, fitness_level, weight_kg)
VALUES (1, 'dev_user', 'dev@test.com', 'intermediate', 75);

INSERT IGNORE INTO streaks (user_id)
VALUES (1);
