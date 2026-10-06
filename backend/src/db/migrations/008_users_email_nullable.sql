-- ============================================================
-- 008_users_email_nullable.sql
-- users.email pasa a admitir NULL para cuentas de Firebase sin email
-- (p. ej. login por teléfono). Antes se guardaba '' y la segunda cuenta
-- sin email chocaba con el UNIQUE. MySQL permite varios NULL en un UNIQUE.
-- ============================================================

ALTER TABLE users MODIFY email VARCHAR(255) NULL;

UPDATE users SET email = NULL WHERE email = '';
