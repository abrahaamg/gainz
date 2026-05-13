-- ============================================================
-- 006_secondary_muscles.sql
-- Poblar secondary_muscles para los 25 ejercicios del seed
-- Ejecutar en MySQL Workbench: File > Open SQL Script > Execute
-- ============================================================

USE fitness_tracker;
SET SQL_SAFE_UPDATES = 0;

-- ─── FUERZA ─────────────────────────────────────────────────
-- Press de Banca: pecho principal, secundarios triceps + hombro frontal
UPDATE exercises SET secondary_muscles = '["triceps","shoulders"]'
WHERE name = 'Press de Banca';

-- Sentadilla con Barra: cuádriceps principal, secundarios glúteos + isquios + core
UPDATE exercises SET secondary_muscles = '["glutes","hamstrings","core"]'
WHERE name = 'Sentadilla con Barra';

-- Peso Muerto: espalda principal, secundarios glúteos + isquios + core + antebrazos
UPDATE exercises SET secondary_muscles = '["glutes","hamstrings","core","forearms"]'
WHERE name = 'Peso Muerto';

-- Dominadas: espalda principal, secundarios bíceps + core + antebrazos
UPDATE exercises SET secondary_muscles = '["biceps","core","forearms"]'
WHERE name = 'Dominadas';

-- Press Militar: hombros principal, secundarios tríceps + core
UPDATE exercises SET secondary_muscles = '["triceps","core"]'
WHERE name = 'Press Militar';

-- Remo con Barra: espalda principal, secundarios bíceps + core + antebrazos
UPDATE exercises SET secondary_muscles = '["biceps","core","forearms"]'
WHERE name = 'Remo con Barra';

-- Fondos en Paralelas: pecho principal, secundarios tríceps + hombros
UPDATE exercises SET secondary_muscles = '["triceps","shoulders"]'
WHERE name = 'Fondos en Paralelas';

-- Curl de Bíceps: bíceps (arms) principal, secundarios antebrazos
UPDATE exercises SET secondary_muscles = '["forearms"]'
WHERE name = 'Curl de Bíceps con Barra';

-- ─── CARDIO ─────────────────────────────────────────────────
-- Carrera en Cinta: full_body principal, secundarios cuádriceps + isquios + gemelos
UPDATE exercises SET secondary_muscles = '["quadriceps","hamstrings","calves"]'
WHERE name = 'Carrera en Cinta';

-- Bicicleta Estática: piernas principal, secundarios cuádriceps + glúteos
UPDATE exercises SET secondary_muscles = '["quadriceps","glutes"]'
WHERE name = 'Bicicleta Estática';

-- Saltar a la Comba: full_body principal, secundarios gemelos + hombros + core
UPDATE exercises SET secondary_muscles = '["calves","shoulders","core"]'
WHERE name = 'Saltar a la Comba';

-- Burpees: full_body principal, secundarios pecho + cuádriceps + core + hombros
UPDATE exercises SET secondary_muscles = '["chest","quadriceps","core","shoulders"]'
WHERE name = 'Burpees';

-- Mountain Climbers: core principal, secundarios hombros + cuádriceps
UPDATE exercises SET secondary_muscles = '["shoulders","quadriceps"]'
WHERE name = 'Mountain Climbers';

-- Remo en Ergómetro: full_body principal, secundarios lats + cuádriceps + bíceps
UPDATE exercises SET secondary_muscles = '["lats","quadriceps","biceps"]'
WHERE name = 'Remo en Ergómetro';

-- ─── HIIT ───────────────────────────────────────────────────
-- Thrusters: full_body principal, secundarios cuádriceps + hombros + tríceps + core
UPDATE exercises SET secondary_muscles = '["quadriceps","shoulders","triceps","core"]'
WHERE name = 'Thrusters con Mancuernas';

-- Box Jumps: piernas principal, secundarios glúteos + gemelos + core
UPDATE exercises SET secondary_muscles = '["glutes","calves","core"]'
WHERE name = 'Box Jumps';

-- Kettlebell Swings: full_body principal, secundarios glúteos + isquios + hombros + core
UPDATE exercises SET secondary_muscles = '["glutes","hamstrings","shoulders","core"]'
WHERE name = 'Kettlebell Swings';

-- Battle Ropes: full_body principal, secundarios hombros + core + bíceps
UPDATE exercises SET secondary_muscles = '["shoulders","core","biceps"]'
WHERE name = 'Battle Ropes';

-- Sprints: piernas principal, secundarios glúteos + gemelos + core
UPDATE exercises SET secondary_muscles = '["glutes","calves","core"]'
WHERE name = 'Sprints 20 metros';

-- ─── FLEXIBILIDAD ───────────────────────────────────────────
-- Cat-Cow: espalda principal, secundarios core
UPDATE exercises SET secondary_muscles = '["core"]'
WHERE name = 'Cat-Cow';

-- Pigeon Pose: piernas principal, secundarios glúteos
UPDATE exercises SET secondary_muscles = '["glutes"]'
WHERE name = 'Pigeon Pose';

-- Hip Flexor Stretch: piernas principal, secundarios glúteos + core
UPDATE exercises SET secondary_muscles = '["glutes","core"]'
WHERE name = 'Hip Flexor Stretch';

-- Estiramiento Isquiotibiales: piernas principal, secundarios lats
UPDATE exercises SET secondary_muscles = '["lats"]'
WHERE name = 'Estiramiento de Isquiotibiales';

-- ─── EQUILIBRIO ─────────────────────────────────────────────
-- Pistol Squat: piernas principal, secundarios glúteos + core + cuádriceps
UPDATE exercises SET secondary_muscles = '["glutes","core","quadriceps"]'
WHERE name = 'Pistol Squat';

-- Single Leg Deadlift: piernas principal, secundarios glúteos + isquios + core
UPDATE exercises SET secondary_muscles = '["glutes","hamstrings","core"]'
WHERE name = 'Single Leg Deadlift';

SET SQL_SAFE_UPDATES = 1;
