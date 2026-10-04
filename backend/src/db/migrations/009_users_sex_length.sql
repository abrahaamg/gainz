-- ============================================================
-- 009_users_sex_length.sql
-- users.sex pasa de VARCHAR(10) a VARCHAR(16): el onboarding envía
-- 'unspecified' (11 caracteres) y no cabía.
-- Idempotente: MODIFY deja la columna igual si ya es VARCHAR(16).
-- Ejecutar en MySQL Workbench: File → Open SQL Script → Execute
-- ============================================================

USE fitness_tracker;

ALTER TABLE users MODIFY sex VARCHAR(16) DEFAULT NULL;
