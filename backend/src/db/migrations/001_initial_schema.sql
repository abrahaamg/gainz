-- ============================================================
-- 001_initial_schema.sql
-- TFG Gainz — Fitness Routine Manager
-- Ejecutar en MySQL Workbench: abre el archivo y pulsa el rayo (Execute)
-- ============================================================

CREATE DATABASE IF NOT EXISTS fitness_tracker
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fitness_tracker;

-- ─────────────────────────────────────────────────────────────
-- 1. USERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  firebase_uid  VARCHAR(128) UNIQUE,
  username      VARCHAR(100) NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  fitness_level VARCHAR(20)  DEFAULT 'beginner',
  -- beginner | intermediate | advanced
  goals         JSON         DEFAULT ('[]'),
  weight_kg     DECIMAL(5,2),
  avatar_url    VARCHAR(500),
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────
-- 2. EXERCISES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exercises (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  name               VARCHAR(150) NOT NULL,
  category           VARCHAR(30)  NOT NULL,
  -- cardio | strength | flexibility | hiit | balance
  muscle_group       VARCHAR(100) NOT NULL,
  -- chest | back | legs | shoulders | arms | core | full_body
  secondary_muscles  JSON         DEFAULT ('[]'),
  description        TEXT,
  instructions       TEXT,
  difficulty         VARCHAR(10)  DEFAULT 'medium',
  -- easy | medium | hard
  video_url          VARCHAR(500),
  image_url          VARCHAR(500),
  requires_equipment BOOLEAN      DEFAULT false,
  is_unilateral      BOOLEAN      DEFAULT false,
  notes              TEXT,
  -- NIVEL 1: nota del creador del ejercicio (técnica, advertencias)
  created_by         INT,
  is_public          BOOLEAN      DEFAULT true,
  created_at         DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- 3. ROUTINES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS routines (
  id                     INT AUTO_INCREMENT PRIMARY KEY,
  user_id                INT NOT NULL,
  name                   VARCHAR(150) NOT NULL,
  description            TEXT,
  goal                   VARCHAR(30),
  -- strength | cardio | weight_loss | flexibility | general
  difficulty             VARCHAR(10)  DEFAULT 'medium',
  estimated_duration_min INT,
  warmup_notes           TEXT,
  cooldown_notes         TEXT,
  is_public              BOOLEAN      DEFAULT false,
  times_completed        INT          DEFAULT 0,
  tags                   JSON         DEFAULT ('[]'),
  created_at             DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────
-- 4. ROUTINE_EXERCISES  — tabla intermedia clave
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS routine_exercises (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  routine_id        INT NOT NULL,
  exercise_id       INT NOT NULL,
  order_index       INT NOT NULL,
  sets              INT          DEFAULT 3,
  reps              INT,
  -- NULL si el ejercicio es por tiempo
  duration_seconds  INT,
  -- NULL si el ejercicio es por reps
  rest_seconds      INT          DEFAULT 60,
  weight_suggestion DECIMAL(6,2),
  notes             TEXT,
  -- NIVEL 2: nota del creador de la rutina para ese ejercicio
  superset_group    INT,
  -- NULL = normal, mismo número = superserie
  UNIQUE KEY unique_order (routine_id, order_index),
  FOREIGN KEY (routine_id)  REFERENCES routines(id)  ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────
-- 5. EQUIPMENT
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS equipment (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id   INT NOT NULL,
  name      VARCHAR(100) NOT NULL,
  category  VARCHAR(30),
  -- free_weights | machines | cardio | bodyweight | accessories
  quantity  INT          DEFAULT 1,
  weight_kg DECIMAL(6,2),
  location  VARCHAR(20)  DEFAULT 'home',
  -- home | gym | outdoor
  notes     TEXT,
  UNIQUE KEY unique_user_equipment (user_id, name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────
-- 6. EXERCISE_EQUIPMENT
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exercise_equipment (
  exercise_id    INT NOT NULL,
  equipment_name VARCHAR(100) NOT NULL,
  is_optional    BOOLEAN DEFAULT false,
  PRIMARY KEY (exercise_id, equipment_name),
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────
-- 7. SESSIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  routine_id       INT,
  started_at       DATETIME     DEFAULT CURRENT_TIMESTAMP,
  finished_at      DATETIME,
  duration_seconds INT,
  calories_burned  INT,
  notes            TEXT,
  rating           TINYINT      CHECK (rating BETWEEN 1 AND 5),
  status           VARCHAR(20)  DEFAULT 'in_progress',
  -- in_progress | completed | abandoned
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- 8. SESSION_EXERCISES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_exercises (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  session_id        INT NOT NULL,
  exercise_id       INT NOT NULL,
  set_number        INT NOT NULL,
  reps_done         INT,
  weight_kg         DECIMAL(6,2),
  duration_done_sec INT,
  rpe               TINYINT     CHECK (rpe BETWEEN 1 AND 10),
  notes             TEXT,
  -- NIVEL 3: nota del usuario por serie durante la ejecución
  completed         BOOLEAN     DEFAULT false,
  completed_at      DATETIME,
  FOREIGN KEY (session_id)  REFERENCES sessions(id)  ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

-- ─────────────────────────────────────────────────────────────
-- 9. STREAKS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS streaks (
  user_id           INT PRIMARY KEY,
  current_streak    INT      DEFAULT 0,
  longest_streak    INT      DEFAULT 0,
  last_workout_date DATE,
  total_workouts    INT      DEFAULT 0,
  total_minutes     INT      DEFAULT 0,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────
-- 10. PERSONAL_RECORDS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS personal_records (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  exercise_id  INT NOT NULL,
  record_type  VARCHAR(20) NOT NULL,
  -- max_weight | max_reps | max_duration
  value        DECIMAL(8,2) NOT NULL,
  achieved_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  session_id   INT,
  UNIQUE KEY unique_record (user_id, exercise_id, record_type),
  FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id)  REFERENCES sessions(id)  ON DELETE SET NULL
);
