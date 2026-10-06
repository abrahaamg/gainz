-- ============================================================
-- 001_seed_exercises.sql
-- 25 ejercicios: 8 fuerza, 6 cardio, 5 hiit, 4 flexibilidad, 2 equilibrio
-- más sus músculos secundarios y sus vínculos con el equipo del catálogo.
--
-- Idempotente: los ejercicios pasan por una tabla temporal y solo se copian
-- los que no existen ya en el catálogo (mismo nombre y created_by IS NULL).
-- Los vínculos con el equipo usan INSERT IGNORE y los UPDATE dejan siempre
-- el mismo valor.
-- ============================================================

DROP TEMPORARY TABLE IF EXISTS tmp_seed_exercises;
CREATE TEMPORARY TABLE tmp_seed_exercises (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  name               VARCHAR(150) NOT NULL,
  category           VARCHAR(30)  NOT NULL,
  muscle_group       VARCHAR(100) NOT NULL,
  difficulty         VARCHAR(10),
  requires_equipment BOOLEAN,
  description        TEXT,
  instructions       TEXT,
  notes              TEXT
);

INSERT INTO tmp_seed_exercises (name, category, muscle_group, difficulty, requires_equipment, description, instructions, notes) VALUES


-- ─── FUERZA (8) ───────────────────────────────────────────
('Press de Banca', 'strength', 'chest', 'medium', true,
 'Ejercicio compuesto para pecho, hombro anterior y tríceps.',
 '1. Túmbate en el banco plano.\n2. Agarra la barra algo más ancho que los hombros.\n3. Baja la barra controlado hasta el pecho.\n4. Empuja hasta extensión completa.',
 'Mantén los pies en el suelo y los glúteos apoyados en el banco en todo momento.'),

('Sentadilla con Barra', 'strength', 'legs', 'hard', true,
 'El rey de los ejercicios de tren inferior. Trabaja cuádriceps, glúteos e isquios.',
 '1. Barra apoyada en la parte alta del trapecio.\n2. Pies a la anchura de hombros, puntas ligeramente hacia fuera.\n3. Baja manteniendo el pecho arriba hasta muslos paralelos al suelo.\n4. Sube empujando el suelo.',
 'No dejes que las rodillas colapsen hacia dentro. Mira al frente.'),

('Peso Muerto', 'strength', 'back', 'hard', true,
 'Ejercicio de cadena posterior completa: lumbares, glúteos, isquios y trapecios.',
 '1. Pies a la anchura de caderas, barra sobre el mediopié.\n2. Agarre a la anchura de hombros.\n3. Espalda recta, empuja el suelo con los pies y tira de la barra.\n4. Bloquea en la parte alta apretando glúteos.',
 'Nunca redondees la espalda baja. Es el error más peligroso de este ejercicio.'),

('Dominadas', 'strength', 'back', 'hard', false,
 'Ejercicio de tracción vertical para dorsal, bíceps y romboides.',
 '1. Cuelga de la barra con agarre prono, manos algo más anchas que hombros.\n2. Tira del codo hacia abajo y atrás.\n3. Sube hasta que la barbilla pase la barra.\n4. Baja de forma controlada.',
 'Si no puedes hacer una, usa una banda elástica de asistencia o haz negativas.'),

('Press Militar', 'strength', 'shoulders', 'medium', true,
 'Empuje vertical para hombros anteriores, trapecios y tríceps.',
 '1. De pie o sentado, barra a la altura de clavículas.\n2. Empuja la barra hacia arriba describiendo una línea vertical.\n3. Bloquea arriba sin hiperextender la espalda.\n4. Baja controlado.',
 'Activa el core durante todo el movimiento para proteger la zona lumbar.'),

('Remo con Barra', 'strength', 'back', 'medium', true,
 'Tracción horizontal para dorsal, romboides, bíceps y retractores escapulares.',
 '1. Torso inclinado 45 grados, rodillas ligeramente flexionadas.\n2. Tira de la barra hacia el ombligo.\n3. Aprieta los omóplatos al final del recorrido.\n4. Baja de forma controlada.',
 'No uses el impulso de la espalda baja para tirar. El movimiento es de codos.'),

('Fondos en Paralelas', 'strength', 'chest', 'medium', false,
 'Empuje vertical descendente para pecho, tríceps y hombro anterior.',
 '1. Sujétate en las paralelas con brazos extendidos.\n2. Inclínate ligeramente hacia delante para enfatizar el pecho.\n3. Baja hasta que los codos estén a 90 grados.\n4. Empuja hasta arriba.',
 'La inclinación del torso determina si trabajas más pecho (inclinado) o tríceps (recto).'),

('Curl de Bíceps con Barra', 'strength', 'arms', 'easy', true,
 'Aislamiento de bíceps braquial y braquiorradial.',
 '1. De pie, barra con agarre supino a la anchura de hombros.\n2. Flexiona el codo subiendo la barra hacia los hombros.\n3. No muevas los codos del costado.\n4. Baja de forma controlada.',
 'Evita balancear el torso. Si lo haces, el peso es demasiado.'),

-- ─── CARDIO (6) ───────────────────────────────────────────
('Carrera en Cinta', 'cardio', 'full_body', 'medium', true,
 'Cardio aeróbico de bajo impacto para resistencia cardiovascular.',
 '1. Empieza caminando 2 minutos para calentar.\n2. Sube la velocidad progresivamente.\n3. Mantén la postura erguida y los brazos en movimiento natural.\n4. Termina con 2 minutos caminando.',
 'Mantén un ritmo en el que puedas mantener una conversación (zona aeróbica).'),

('Bicicleta Estática', 'cardio', 'legs', 'easy', true,
 'Cardio de bajo impacto articular, ideal para recuperación activa.',
 '1. Ajusta el sillín a la altura de cadera.\n2. Pedalea con el talón apoyado en el pedal.\n3. Mantén una cadencia constante de 70-90 rpm.\n4. Ajusta la resistencia según el objetivo.',
 'Excelente opción si tienes molestias en rodillas o caderas.'),

('Saltar a la Comba', 'cardio', 'full_body', 'medium', false,
 'Cardio de alta intensidad que mejora coordinación y resistencia.',
 '1. Sostén los mangos de la comba a la altura de las caderas.\n2. Salta con ambos pies juntos.\n3. Mantén las muñecas relajadas, el movimiento viene de ellas.\n4. Aterriza suavemente en la punta de los pies.',
 'Empieza con series de 30 segundos y descansa. Progresa hasta minutos completos.'),

('Burpees', 'cardio', 'full_body', 'hard', false,
 'Ejercicio de cuerpo completo de alta intensidad que combina fuerza y cardio.',
 '1. De pie, agáchate y apoya las manos en el suelo.\n2. Salta los pies atrás a posición de plancha.\n3. Haz una flexión (opcional).\n4. Salta los pies hacia las manos y salta arriba con los brazos extendidos.',
 'Es un ejercicio muy exigente. Prioriza la técnica sobre la velocidad.'),

('Mountain Climbers', 'cardio', 'core', 'medium', false,
 'Cardio en el suelo que activa el core y eleva la frecuencia cardíaca.',
 '1. Posición de plancha alta con los brazos extendidos.\n2. Lleva una rodilla hacia el pecho de forma explosiva.\n3. Alterna las piernas rápidamente como si corrieras en horizontal.\n4. Mantén las caderas a la altura de los hombros.',
 'Cuanto más rápido, más cardio. Cuanto más lento, más core.'),

('Remo en Ergómetro', 'cardio', 'full_body', 'medium', true,
 'Cardio de cuerpo completo con bajo impacto articular. Trabaja piernas, espalda y brazos.',
 '1. Siéntate en el remo con las asas a la altura del pecho.\n2. Empuja con las piernas primero, luego inclina el torso atrás.\n3. Por último tira con los brazos hasta el pecho.\n4. Invierte el movimiento de forma controlada.',
 'El 60% de la potencia viene de las piernas. No te apoyes demasiado en los brazos.'),

-- ─── HIIT (5) ─────────────────────────────────────────────
('Thrusters con Mancuernas', 'hiit', 'full_body', 'hard', true,
 'Combinación de sentadilla frontal y press de hombros. Ejercicio metabólico total.',
 '1. Mancuernas a la altura de los hombros.\n2. Haz una sentadilla completa.\n3. Al subir, usa el impulso para presionar las mancuernas sobre la cabeza.\n4. Baja las mancuernas mientras vuelves a la sentadilla.',
 'Uno de los ejercicios más exigentes metabólicamente. Gestiona bien el ritmo.'),

('Box Jumps', 'hiit', 'legs', 'hard', true,
 'Pliometría para potencia explosiva de tren inferior.',
 '1. De pie frente al cajón, pies a la anchura de hombros.\n2. Semiflexiona las rodillas y balancea los brazos.\n3. Salta con ambos pies y aterriza suavemente en el cajón.\n4. Baja de un paso, no saltando.',
 'Aterriza con las rodillas flexionadas para absorber el impacto. Nunca de pie recto.'),

('Kettlebell Swings', 'hiit', 'full_body', 'medium', true,
 'Ejercicio de bisagra de cadera explosivo con alta demanda cardiovascular.',
 '1. Kettlebell en el suelo entre los pies.\n2. Agárrate con las dos manos, espalda recta.\n3. Impulsiona las caderas hacia delante explosivamente.\n4. Deja que la kettlebell suba hasta la altura de los hombros por inercia.',
 'El movimiento es de cadera, no de brazos. Los brazos solo guían la kettlebell.'),

('Battle Ropes', 'hiit', 'full_body', 'medium', true,
 'Cardio de alta intensidad con cuerdas que trabaja hombros, core y resistencia.',
 '1. Sujeta un extremo de la cuerda en cada mano.\n2. Con rodillas semiflexionadas y core activo.\n3. Mueve los brazos alternadamente arriba y abajo de forma explosiva.\n4. Mantén el ritmo durante el intervalo.',
 'Varía los patrones: ondas alternas, ondas dobles, movimientos laterales.'),

('Sprints 20 metros', 'hiit', 'legs', 'hard', false,
 'Velocidad máxima en distancia corta. Potencia y aceleración explosiva.',
 '1. Posición de salida con una pierna adelantada.\n2. Arranca con máxima explosividad.\n3. Corre los 20 metros al 100% de velocidad.\n4. Desacelera progresivamente y camina de vuelta.',
 'Solo son efectivos si cada sprint es al máximo. Descansa completamente entre ellos.'),

-- ─── FLEXIBILIDAD (4) ─────────────────────────────────────
('Cat-Cow', 'flexibility', 'back', 'easy', false,
 'Movilidad de columna vertebral. Ideal para calentamiento y recuperación.',
 '1. A cuatro patas, muñecas bajo hombros, rodillas bajo caderas.\n2. Inhala: hunde el vientre, sube la cabeza y el cóccix (cow).\n3. Exhala: redondea la espalda, mete el cóccix y la barbilla (cat).\n4. Alterna de forma fluida con la respiración.',
 'Sincroniza el movimiento con la respiración para máximo beneficio.'),

('Pigeon Pose', 'flexibility', 'legs', 'medium', false,
 'Estiramiento profundo de cadera, piriforme y flexores de cadera.',
 '1. Desde cuatro patas, desliza la rodilla derecha hacia la muñeca derecha.\n2. El pie derecho apunta hacia la muñeca izquierda.\n3. Extiende la pierna izquierda atrás.\n4. Inclínate hacia delante apoyando los antebrazos.',
 'Si la cadera no llega al suelo, coloca un cojín o bloque debajo.'),

('Hip Flexor Stretch', 'flexibility', 'legs', 'easy', false,
 'Estiramiento de flexores de cadera, fundamental para quienes pasan horas sentados.',
 '1. Arrodíllate en el suelo con una rodilla apoyada.\n2. La otra pierna adelantada con rodilla a 90 grados.\n3. Empuja la cadera hacia delante manteniendo el torso recto.\n4. Mantén 30-45 segundos y cambia.',
 'Aprieta el glúteo de la pierna de atrás para intensificar el estiramiento.'),

('Estiramiento de Isquiotibiales', 'flexibility', 'legs', 'easy', false,
 'Estiramiento de la cadena posterior. Mejora movilidad y reduce riesgo de lesión.',
 '1. Sentado en el suelo con una pierna extendida.\n2. La otra pierna doblada con la planta del pie en el muslo contrario.\n3. Inclínate hacia la pierna extendida manteniendo la espalda recta.\n4. Mantén 30-45 segundos.',
 'Lleva el pecho hacia el muslo, no la frente hacia la rodilla.'),

-- ─── EQUILIBRIO (2) ───────────────────────────────────────
('Pistol Squat', 'balance', 'legs', 'hard', false,
 'Sentadilla a una pierna. Máxima exigencia de fuerza, equilibrio y movilidad.',
 '1. De pie en una sola pierna.\n2. Extiende la otra pierna al frente.\n3. Baja hasta la posición más profunda posible manteniendo el equilibrio.\n4. Empuja para subir sin apoyar la pierna libre.',
 'Comienza apoyándote en una pared o TRX. Es un ejercicio que requiere semanas de práctica.'),

('Single Leg Deadlift', 'balance', 'legs', 'medium', false,
 'Peso muerto a una pierna. Trabaja glúteos, isquios y propiocepción.',
 '1. De pie en una pierna con rodilla ligeramente flexionada.\n2. Inclina el torso hacia delante mientras la pierna libre sube atrás.\n3. Forma una T con el cuerpo: torso y pierna libre paralelos al suelo.\n4. Vuelve a la posición inicial apretando el glúteo.',
 'Mira un punto fijo al frente para mantener el equilibrio. Mueve caderas y torso como una unidad.');

-- ─── Copiar al catálogo solo los que faltan ──────────────────
INSERT INTO exercises (name, category, muscle_group, difficulty, requires_equipment, description, instructions, notes)
SELECT t.name, t.category, t.muscle_group, t.difficulty, t.requires_equipment,
       t.description, t.instructions, t.notes
FROM tmp_seed_exercises t
WHERE NOT EXISTS (
  SELECT 1 FROM exercises e
  WHERE e.name = t.name AND e.created_by IS NULL
)
ORDER BY t.id;

DROP TEMPORARY TABLE tmp_seed_exercises;

-- ═══════════════════════════════════════════════════════════════
-- MÚSCULOS SECUNDARIOS (antes en la migración 006)
-- ═══════════════════════════════════════════════════════════════

-- ─── FUERZA ─────────────────────────────────────────────────
-- Press de Banca: pecho principal, secundarios triceps + hombro frontal
UPDATE exercises SET secondary_muscles = '["triceps","shoulders"]'
WHERE name = 'Press de Banca' AND created_by IS NULL;

-- Sentadilla con Barra: cuádriceps principal, secundarios glúteos + isquios + core
UPDATE exercises SET secondary_muscles = '["glutes","hamstrings","core"]'
WHERE name = 'Sentadilla con Barra' AND created_by IS NULL;

-- Peso Muerto: espalda principal, secundarios glúteos + isquios + core + antebrazos
UPDATE exercises SET secondary_muscles = '["glutes","hamstrings","core","forearms"]'
WHERE name = 'Peso Muerto' AND created_by IS NULL;

-- Dominadas: espalda principal, secundarios bíceps + core + antebrazos
UPDATE exercises SET secondary_muscles = '["biceps","core","forearms"]'
WHERE name = 'Dominadas' AND created_by IS NULL;

-- Press Militar: hombros principal, secundarios tríceps + core
UPDATE exercises SET secondary_muscles = '["triceps","core"]'
WHERE name = 'Press Militar' AND created_by IS NULL;

-- Remo con Barra: espalda principal, secundarios bíceps + core + antebrazos
UPDATE exercises SET secondary_muscles = '["biceps","core","forearms"]'
WHERE name = 'Remo con Barra' AND created_by IS NULL;

-- Fondos en Paralelas: pecho principal, secundarios tríceps + hombros
UPDATE exercises SET secondary_muscles = '["triceps","shoulders"]'
WHERE name = 'Fondos en Paralelas' AND created_by IS NULL;

-- Curl de Bíceps: bíceps (arms) principal, secundarios antebrazos
UPDATE exercises SET secondary_muscles = '["forearms"]'
WHERE name = 'Curl de Bíceps con Barra' AND created_by IS NULL;

-- ─── CARDIO ─────────────────────────────────────────────────
-- Carrera en Cinta: full_body principal, secundarios cuádriceps + isquios + gemelos
UPDATE exercises SET secondary_muscles = '["quadriceps","hamstrings","calves"]'
WHERE name = 'Carrera en Cinta' AND created_by IS NULL;

-- Bicicleta Estática: piernas principal, secundarios cuádriceps + glúteos
UPDATE exercises SET secondary_muscles = '["quadriceps","glutes"]'
WHERE name = 'Bicicleta Estática' AND created_by IS NULL;

-- Saltar a la Comba: full_body principal, secundarios gemelos + hombros + core
UPDATE exercises SET secondary_muscles = '["calves","shoulders","core"]'
WHERE name = 'Saltar a la Comba' AND created_by IS NULL;

-- Burpees: full_body principal, secundarios pecho + cuádriceps + core + hombros
UPDATE exercises SET secondary_muscles = '["chest","quadriceps","core","shoulders"]'
WHERE name = 'Burpees' AND created_by IS NULL;

-- Mountain Climbers: core principal, secundarios hombros + cuádriceps
UPDATE exercises SET secondary_muscles = '["shoulders","quadriceps"]'
WHERE name = 'Mountain Climbers' AND created_by IS NULL;

-- Remo en Ergómetro: full_body principal, secundarios lats + cuádriceps + bíceps
UPDATE exercises SET secondary_muscles = '["lats","quadriceps","biceps"]'
WHERE name = 'Remo en Ergómetro' AND created_by IS NULL;

-- ─── HIIT ───────────────────────────────────────────────────
-- Thrusters: full_body principal, secundarios cuádriceps + hombros + tríceps + core
UPDATE exercises SET secondary_muscles = '["quadriceps","shoulders","triceps","core"]'
WHERE name = 'Thrusters con Mancuernas' AND created_by IS NULL;

-- Box Jumps: piernas principal, secundarios glúteos + gemelos + core
UPDATE exercises SET secondary_muscles = '["glutes","calves","core"]'
WHERE name = 'Box Jumps' AND created_by IS NULL;

-- Kettlebell Swings: full_body principal, secundarios glúteos + isquios + hombros + core
UPDATE exercises SET secondary_muscles = '["glutes","hamstrings","shoulders","core"]'
WHERE name = 'Kettlebell Swings' AND created_by IS NULL;

-- Battle Ropes: full_body principal, secundarios hombros + core + bíceps
UPDATE exercises SET secondary_muscles = '["shoulders","core","biceps"]'
WHERE name = 'Battle Ropes' AND created_by IS NULL;

-- Sprints: piernas principal, secundarios glúteos + gemelos + core
UPDATE exercises SET secondary_muscles = '["glutes","calves","core"]'
WHERE name = 'Sprints 20 metros' AND created_by IS NULL;

-- ─── FLEXIBILIDAD ───────────────────────────────────────────
-- Cat-Cow: espalda principal, secundarios core
UPDATE exercises SET secondary_muscles = '["core"]'
WHERE name = 'Cat-Cow' AND created_by IS NULL;

-- Pigeon Pose: piernas principal, secundarios glúteos
UPDATE exercises SET secondary_muscles = '["glutes"]'
WHERE name = 'Pigeon Pose' AND created_by IS NULL;

-- Hip Flexor Stretch: piernas principal, secundarios glúteos + core
UPDATE exercises SET secondary_muscles = '["glutes","core"]'
WHERE name = 'Hip Flexor Stretch' AND created_by IS NULL;

-- Estiramiento Isquiotibiales: piernas principal, secundarios lats
UPDATE exercises SET secondary_muscles = '["lats"]'
WHERE name = 'Estiramiento de Isquiotibiales' AND created_by IS NULL;

-- ─── EQUILIBRIO ─────────────────────────────────────────────
-- Pistol Squat: piernas principal, secundarios glúteos + core + cuádriceps
UPDATE exercises SET secondary_muscles = '["glutes","core","quadriceps"]'
WHERE name = 'Pistol Squat' AND created_by IS NULL;

-- Single Leg Deadlift: piernas principal, secundarios glúteos + isquios + core
UPDATE exercises SET secondary_muscles = '["glutes","hamstrings","core"]'
WHERE name = 'Single Leg Deadlift' AND created_by IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- VÍNCULOS EJERCICIO ↔ EQUIPO (antes en la migración 002)
-- ═══════════════════════════════════════════════════════════════


INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra olímpica' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
  UNION ALL SELECT 'Banco plano', false
  UNION ALL SELECT 'Rack / Jaula', true
) eq WHERE e.name = 'Press de Banca' AND e.created_by IS NULL;

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra olímpica' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
  UNION ALL SELECT 'Rack / Jaula', false
) eq WHERE e.name = 'Sentadilla con Barra' AND e.created_by IS NULL;

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra olímpica' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
) eq WHERE e.name = 'Peso Muerto' AND e.created_by IS NULL;

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra de dominadas' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Banda elástica', true
) eq WHERE e.name = 'Dominadas' AND e.created_by IS NULL;

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra olímpica' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
) eq WHERE e.name = 'Press Militar' AND e.created_by IS NULL;

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra olímpica' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
) eq WHERE e.name = 'Remo con Barra' AND e.created_by IS NULL;

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, 'Barra de dominadas', true FROM exercises e
WHERE e.name = 'Fondos en Paralelas' AND e.created_by IS NULL;

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra olímpica' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
  UNION ALL SELECT 'Barra Z / EZ', true
) eq WHERE e.name = 'Curl de Bíceps con Barra' AND e.created_by IS NULL;

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, 'Cinta de correr', false FROM exercises e WHERE e.name = 'Carrera en Cinta' AND e.created_by IS NULL;

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, 'Bicicleta estática', false FROM exercises e WHERE e.name = 'Bicicleta Estática' AND e.created_by IS NULL;

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, 'Cuerda de saltar', false FROM exercises e WHERE e.name = 'Saltar a la Comba' AND e.created_by IS NULL;

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, 'Remo ergómetro', false FROM exercises e WHERE e.name = 'Remo en Ergómetro' AND e.created_by IS NULL;

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, 'Mancuernas', false FROM exercises e WHERE e.name = 'Thrusters con Mancuernas' AND e.created_by IS NULL;

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, 'Cajón pliométrico', false FROM exercises e WHERE e.name = 'Box Jumps' AND e.created_by IS NULL;

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, 'Kettlebell', false FROM exercises e WHERE e.name = 'Kettlebell Swings' AND e.created_by IS NULL;

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, 'Cuerdas de batalla', false FROM exercises e WHERE e.name = 'Battle Ropes' AND e.created_by IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 4. ACTUALIZAR requires_equipment
-- ─────────────────────────────────────────────────────────────
UPDATE exercises SET requires_equipment = true WHERE name = 'Saltar a la Comba' AND created_by IS NULL;
UPDATE exercises SET requires_equipment = true WHERE name = 'Dominadas' AND created_by IS NULL;
UPDATE exercises SET requires_equipment = true WHERE name = 'Curl de Bíceps con Barra' AND created_by IS NULL;

