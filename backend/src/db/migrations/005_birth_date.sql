-- 005_birth_date.sql — Añadir fecha de nacimiento a users
USE fitness_tracker;

ALTER TABLE users ADD COLUMN birth_date DATE NULL AFTER age;
