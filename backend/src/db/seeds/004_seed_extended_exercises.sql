-- ============================================================
-- SEED: Ejercicios extendidos (complementarios al seed original de 25)
-- Ejecutar DESPUÉS de 001_seed_exercises.sql y 006_secondary_muscles.sql
-- ============================================================

USE fitness_tracker;
-- ─── PECHO (14 ejercicios nuevos) ─────────────────────────────

INSERT INTO exercises (name, category, muscle_group, secondary_muscles, description, instructions, difficulty, requires_equipment, is_unilateral, is_public, created_by) VALUES
('Press de Banca Inclinado con Barra', 'strength', 'chest', '["shoulders","triceps"]',
 'Variante del press de banca en banco inclinado a 30-45° que enfatiza la porción superior del pecho.',
 '1. Ajusta el banco a 30-45° de inclinación.\n2. Agarra la barra a la anchura de los hombros.\n3. Baja la barra controladamente hasta la parte superior del pecho.\n4. Empuja de forma explosiva hasta la extensión completa.',
 'medium', true, false, true, NULL),

('Press de Banca Declinado con Barra', 'strength', 'chest', '["triceps","shoulders"]',
 'Press en banco declinado que trabaja la porción inferior del pecho con mayor activación.',
 '1. Ajusta el banco en posición declinada (15-30°).\n2. Asegura los pies en los soportes.\n3. Baja la barra hasta la parte baja del pecho.\n4. Empuja hasta la extensión completa de brazos.',
 'medium', true, false, true, NULL),

('Press de Banca con Mancuernas', 'strength', 'chest', '["shoulders","triceps"]',
 'Press horizontal con mancuernas que permite mayor rango de movimiento y trabajo independiente de cada lado.',
 '1. Túmbate en el banco con una mancuerna en cada mano.\n2. Posiciona las mancuernas a la altura del pecho con los codos a 45°.\n3. Empuja hacia arriba juntando ligeramente las mancuernas.\n4. Baja controladamente.',
 'medium', true, false, true, NULL),
 
('Press Inclinado con Mancuernas', 'strength', 'chest', '["shoulders","triceps"]',
 'Press con mancuernas en banco inclinado para enfatizar el pecho superior con rango completo.',
 '1. Ajusta el banco a 30-45°.\n2. Sube las mancuernas hasta la posición inicial con brazos extendidos.\n3. Baja controladamente con los codos a 45° del torso.\n4. Empuja hasta arriba.',
 'medium', true, false, true, NULL),

('Aperturas con Mancuernas', 'strength', 'chest', '["shoulders"]',
 'Ejercicio de aislamiento para el pecho que trabaja la aducción horizontal del hombro.',
 '1. Túmbate en banco plano con mancuernas en posición de press.\n2. Con los codos ligeramente flexionados, abre los brazos en arco.\n3. Baja hasta sentir estiramiento en el pecho.\n4. Cierra los brazos en arco hasta la posición inicial.',
 'medium', true, false, true, NULL),

('Aperturas Inclinadas con Mancuernas', 'strength', 'chest', '["shoulders"]',
 'Aperturas en banco inclinado para aislar la porción superior del pecho.',
 '1. Ajusta el banco a 30-45°.\n2. Realiza el mismo movimiento de apertura que en banco plano.\n3. Mantén los codos ligeramente flexionados durante todo el recorrido.\n4. Contrae el pecho al cerrar.',
 'medium', true, false, true, NULL),

('Peck Deck', 'strength', 'chest', '["shoulders"]',
 'Máquina de aislamiento para el pecho que permite un movimiento guiado y seguro.',
 '1. Ajusta el asiento para que los brazos queden a la altura del pecho.\n2. Coloca los antebrazos en las almohadillas.\n3. Junta los brazos frente al pecho contrayendo el pectoral.\n4. Vuelve controladamente a la posición inicial.',
 'easy', true, false, true, NULL),

('Crossover en Polea', 'strength', 'chest', '["shoulders"]',
 'Ejercicio con poleas que permite trabajar el pecho con tensión constante en todo el rango.',
 '1. Ajusta las poleas en posición alta.\n2. Da un paso al frente con un pie adelantado.\n3. Con los codos ligeramente flexionados, junta las manos frente al pecho.\n4. Vuelve controladamente abriendo los brazos.',
 'medium', true, false, true, NULL),

('Press en Máquina (Chest Press)', 'strength', 'chest', '["shoulders","triceps"]',
 'Press de pecho en máquina guiada, ideal para principiantes o series de alta fatiga.',
 '1. Ajusta el asiento para que las asas queden a la altura del pecho.\n2. Agarra las asas y empuja hacia delante.\n3. Extiende los brazos sin bloquear los codos.\n4. Vuelve controladamente.',
 'easy', true, false, true, NULL),

('Flexiones', 'strength', 'chest', '["triceps","shoulders","core"]',
 'Ejercicio fundamental de empuje con peso corporal que trabaja pecho, tríceps y core.',
 '1. Colócate en posición de plancha con las manos a la anchura de los hombros.\n2. Baja el cuerpo manteniendo el core activado.\n3. Toca el suelo con el pecho.\n4. Empuja hasta la posición inicial.',
 'easy', false, false, true, NULL),

('Flexiones con Pies Elevados', 'strength', 'chest', '["shoulders","triceps","core"]',
 'Variante de flexiones con los pies en alto que aumenta la carga sobre el pecho superior.',
 '1. Coloca los pies sobre un banco o caja.\n2. Realiza flexiones con el cuerpo en línea recta.\n3. Baja hasta que el pecho casi toque el suelo.\n4. Empuja hasta la extensión.',
 'medium', false, false, true, NULL),

('Flexiones Diamante', 'strength', 'chest', '["triceps","core"]',
 'Variante de flexiones con manos juntas en forma de diamante que enfatiza tríceps y pecho interior.',
 '1. Coloca las manos juntas bajo el pecho formando un diamante con los dedos.\n2. Baja controladamente manteniendo los codos pegados al cuerpo.\n3. Empuja hasta la extensión completa.',
 'medium', false, false, true, NULL),

('Pullover con Mancuerna', 'strength', 'chest', '["back","triceps"]',
 'Ejercicio que trabaja pecho y dorsal a través de la extensión del hombro.',
 '1. Túmbate perpendicular al banco apoyando solo la parte alta de la espalda.\n2. Sujeta una mancuerna con ambas manos sobre el pecho.\n3. Baja la mancuerna por detrás de la cabeza con los codos ligeramente flexionados.\n4. Vuelve a la posición inicial contrayendo pecho y dorsal.',
 'medium', true, false, true, NULL),

('Pullover en Polea', 'strength', 'chest', '["back","triceps"]',
 'Pullover con tensión constante gracias a la polea, ideal para aislar dorsal y pecho.',
 '1. Colócate frente a una polea alta con agarre recto o cuerda.\n2. Con los brazos casi extendidos, tira del agarre hacia abajo en arco.\n3. Lleva las manos hasta las caderas.\n4. Vuelve controladamente.',
 'medium', true, false, true, NULL);

-- ─── ESPALDA (17 ejercicios nuevos) ──────────────────────────

INSERT INTO exercises (name, category, muscle_group, secondary_muscles, description, instructions, difficulty, requires_equipment, is_unilateral, is_public, created_by) VALUES
('Jalón al Pecho Agarre Abierto', 'strength', 'back', '["biceps","forearms"]',
 'Jalón con agarre prono abierto que enfatiza los dorsales y la amplitud de espalda.',
 '1. Siéntate en la máquina de jalón y agarra la barra con agarre ancho.\n2. Tira de la barra hacia la parte superior del pecho.\n3. Aprieta las escápulas abajo y atrás.\n4. Vuelve controladamente.',
 'medium', true, false, true, NULL),

('Jalón al Pecho Agarre Cerrado', 'strength', 'back', '["biceps","forearms"]',
 'Jalón con agarre cerrado que enfatiza la porción inferior del dorsal y los bíceps.',
 '1. Usa un agarre en V o barra corta con las manos juntas.\n2. Tira hacia el pecho manteniendo el torso ligeramente inclinado.\n3. Contrae la espalda en la posición baja.\n4. Extiende controladamente.',
 'medium', true, false, true, NULL),

('Jalón al Pecho Agarre Neutro', 'strength', 'back', '["biceps","forearms"]',
 'Jalón con agarre neutro (palmas enfrentadas) que reduce estrés en los hombros.',
 '1. Usa un agarre con palmas enfrentadas.\n2. Tira de la barra hasta el pecho.\n3. Mantén los codos apuntando hacia abajo.\n4. Vuelve controladamente sin dejar que el peso tire de ti.',
 'medium', true, false, true, NULL),

('Remo con Mancuerna Unilateral', 'strength', 'back', '["biceps","forearms","core"]',
 'Remo a una mano apoyado en banco que permite un rango de movimiento amplio.',
 '1. Apoya una rodilla y mano en el banco.\n2. Con la otra mano, sujeta la mancuerna.\n3. Tira de la mancuerna hacia la cadera retrayendo la escápula.\n4. Baja controladamente.',
 'medium', true, true, true, NULL),

('Remo T', 'strength', 'back', '["biceps","forearms","core"]',
 'Remo con barra T que permite cargar peso significativo para desarrollo de espalda.',
 '1. Coloca un extremo de la barra en una esquina o landmine.\n2. Sujeta el otro extremo con un agarre en V.\n3. Con el torso a 45°, tira de la barra hacia el pecho.\n4. Baja controladamente.',
 'medium', true, false, true, NULL),

('Remo en Máquina Unilateral', 'strength', 'back', '["biceps","forearms"]',
 'Remo a un brazo en máquina guiada para trabajo unilateral controlado.',
 '1. Ajusta el asiento y apoya el pecho en la almohadilla.\n2. Tira con un brazo hacia la cadera.\n3. Contrae la escápula en la posición final.\n4. Vuelve controladamente.',
 'easy', true, true, true, NULL),

('Remo en Máquina Bilateral', 'strength', 'back', '["biceps","forearms"]',
 'Remo con ambos brazos en máquina para desarrollo general de espalda.',
 '1. Ajusta el asiento y apoya el pecho.\n2. Agarra ambas asas.\n3. Tira hacia ti retrayendo las escápulas.\n4. Extiende controladamente.',
 'easy', true, false, true, NULL),

('Remo Gironda Agarre Abierto', 'strength', 'back', '["biceps","shoulders"]',
 'Remo con agarre amplio que enfatiza romboides y trapecio medio.',
 '1. Usa una polea baja o máquina con agarre ancho.\n2. Tira hacia el pecho (no hacia el abdomen).\n3. Lleva los codos hacia atrás y arriba.\n4. Contrae romboides y trapecio medio.',
 'medium', true, false, true, NULL),

('Remo Gironda Unilateral', 'strength', 'back', '["biceps","shoulders"]',
 'Variante unilateral del remo Gironda para trabajo asimétrico de espalda.',
 '1. Usa una polea baja con agarre individual.\n2. Tira hacia el pecho con un brazo.\n3. Rota ligeramente el torso al tirar.\n4. Vuelve controladamente.',
 'medium', true, true, true, NULL),

('Face Pull', 'strength', 'shoulders', '["back","biceps"]',
 'Ejercicio en polea para deltoides posterior y rotadores externos, excelente para salud del hombro.',
 '1. Ajusta la polea a la altura de la cara con cuerda.\n2. Tira de la cuerda hacia la cara separando las manos.\n3. Rota los hombros externamente al final del movimiento.\n4. Vuelve controladamente.',
 'easy', true, false, true, NULL),

('Rack Pull', 'strength', 'back', '["legs","forearms","core"]',
 'Peso muerto parcial desde soportes que permite cargar más peso para trapecio y espalda.',
 '1. Coloca la barra en el rack a la altura de las rodillas.\n2. Agarra la barra con agarre prono o mixto.\n3. Extiende las caderas y rodillas hasta quedar erguido.\n4. Baja controladamente hasta los soportes.',
 'hard', true, false, true, NULL),

('Encogimientos de Hombros con Barra', 'strength', 'back', '["forearms"]',
 'Ejercicio de aislamiento para el trapecio superior con barra.',
 '1. Sujeta la barra con agarre prono a la anchura de los hombros.\n2. Encoge los hombros hacia las orejas sin flexionar los codos.\n3. Mantén la contracción 1-2 segundos.\n4. Baja controladamente.',
 'easy', true, false, true, NULL),

('Encogimientos de Hombros con Mancuernas', 'strength', 'back', '["forearms"]',
 'Encogimientos con mancuernas que permiten un rango de movimiento más natural.',
 '1. Sujeta una mancuerna en cada mano a los lados.\n2. Encoge los hombros hacia arriba.\n3. Mantén la contracción arriba.\n4. Baja lentamente.',
 'easy', true, false, true, NULL),

('Remo al Mentón', 'strength', 'shoulders', '["back","biceps"]',
 'Ejercicio compuesto que trabaja deltoides y trapecio tirando la barra hacia la barbilla.',
 '1. Sujeta la barra con agarre estrecho (dentro de los hombros).\n2. Tira de la barra hacia arriba pegada al cuerpo.\n3. Lleva los codos por encima de los hombros.\n4. Baja controladamente.',
 'medium', true, false, true, NULL),

('Peso Muerto Sumo', 'strength', 'legs', '["back","glutes","core"]',
 'Variante del peso muerto con postura amplia que enfatiza aductores y cuádriceps.',
 '1. Coloca los pies más anchos que los hombros con puntas hacia fuera.\n2. Agarra la barra con agarre estrecho entre las piernas.\n3. Extiende caderas y rodillas manteniendo el pecho erguido.\n4. Baja controladamente.',
 'hard', true, false, true, NULL),

('Good Morning', 'strength', 'back', '["legs","glutes","core"]',
 'Flexión de cadera con barra en la espalda para isquiotibiales y espalda baja.',
 '1. Coloca la barra en la espalda alta como en una sentadilla.\n2. Con las rodillas ligeramente flexionadas, inclina el torso hacia delante.\n3. Baja hasta que el torso quede casi paralelo al suelo.\n4. Vuelve a la posición erguida contrayendo isquiotibiales y glúteos.',
 'hard', true, false, true, NULL),

('Hiperextensión en Banco Romano', 'strength', 'back', '["glutes","legs"]',
 'Extensión de cadera en banco romano para espalda baja, glúteos e isquiotibiales.',
 '1. Colócate boca abajo en el banco romano con las caderas sobre el borde.\n2. Cruza los brazos sobre el pecho o detrás de la cabeza.\n3. Baja el torso controladamente.\n4. Sube hasta que el cuerpo quede en línea recta.',
 'easy', true, false, true, NULL);

-- ─── HOMBROS (11 ejercicios nuevos) ──────────────────────────

INSERT INTO exercises (name, category, muscle_group, secondary_muscles, description, instructions, difficulty, requires_equipment, is_unilateral, is_public, created_by) VALUES
('Press Arnold', 'strength', 'shoulders', '["triceps","chest"]',
 'Press de hombros con rotación que trabaja las tres cabezas del deltoides.',
 '1. Siéntate con mancuernas a la altura de los hombros, palmas hacia ti.\n2. Mientras empujas hacia arriba, rota las palmas hacia fuera.\n3. Extiende los brazos completamente.\n4. Baja rotando de vuelta a la posición inicial.',
 'medium', true, false, true, NULL),

('Press con Mancuernas (Hombro)', 'strength', 'shoulders', '["triceps"]',
 'Press de hombros con mancuernas sentado para desarrollo de deltoides.',
 '1. Siéntate con respaldo vertical y mancuernas a la altura de los hombros.\n2. Empuja las mancuernas hacia arriba.\n3. Extiende sin bloquear los codos.\n4. Baja controladamente hasta los hombros.',
 'medium', true, false, true, NULL),

('Press en Máquina (Shoulder Press)', 'strength', 'shoulders', '["triceps"]',
 'Press de hombros en máquina guiada, seguro para series pesadas o de fatiga.',
 '1. Ajusta el asiento para que las asas queden a la altura de los hombros.\n2. Empuja hacia arriba.\n3. Extiende sin bloquear.\n4. Baja controladamente.',
 'easy', true, false, true, NULL),

('Elevaciones Laterales con Mancuernas', 'strength', 'shoulders', '[]',
 'Ejercicio de aislamiento para el deltoides lateral que crea amplitud de hombros.',
 '1. De pie con mancuernas a los lados.\n2. Eleva los brazos lateralmente hasta la altura de los hombros.\n3. Mantén una ligera flexión de codos.\n4. Baja controladamente sin inercia.',
 'easy', true, false, true, NULL),

('Elevaciones Laterales en Polea', 'strength', 'shoulders', '[]',
 'Elevación lateral con polea baja para tensión constante en el deltoides lateral.',
 '1. Colócate de lado a una polea baja.\n2. Agarra el cable con la mano más alejada.\n3. Eleva el brazo lateralmente hasta la altura del hombro.\n4. Baja controladamente.',
 'easy', true, true, true, NULL),

('Elevaciones Frontales con Mancuernas', 'strength', 'shoulders', '["chest"]',
 'Aislamiento del deltoides anterior elevando las mancuernas al frente.',
 '1. De pie con mancuernas frente a los muslos.\n2. Eleva una o ambas mancuernas al frente hasta la altura de los hombros.\n3. Mantén los brazos casi extendidos.\n4. Baja controladamente.',
 'easy', true, false, true, NULL),

('Elevaciones Frontales con Disco', 'strength', 'shoulders', '["chest","core"]',
 'Elevación frontal usando un disco como carga, trabaja deltoides anterior y core.',
 '1. Sujeta un disco con ambas manos frente a las caderas.\n2. Eleva el disco hasta la altura de los ojos.\n3. Mantén el core activado.\n4. Baja controladamente.',
 'easy', true, false, true, NULL),

('Reverse Flys (Pájaro)', 'strength', 'shoulders', '["back"]',
 'Aislamiento del deltoides posterior con mancuernas inclinado hacia delante.',
 '1. Inclina el torso hacia delante a 45° con mancuernas colgando.\n2. Abre los brazos lateralmente con los codos ligeramente flexionados.\n3. Aprieta las escápulas arriba.\n4. Baja controladamente.',
 'easy', true, false, true, NULL),

('Reverse Flys en Máquina', 'strength', 'shoulders', '["back"]',
 'Aislamiento del deltoides posterior en máquina peck deck invertida.',
 '1. Siéntate mirando hacia la máquina.\n2. Agarra las asas con las manos.\n3. Abre los brazos hacia atrás contrayendo la parte posterior del hombro.\n4. Vuelve controladamente.',
 'easy', true, false, true, NULL),

('YTW Raises', 'strength', 'shoulders', '["back"]',
 'Serie de tres movimientos (Y, T, W) para deltoides posterior y estabilizadores escapulares.',
 '1. Inclínate sobre un banco inclinado boca abajo con mancuernas ligeras.\n2. Eleva los brazos en forma de Y, luego T, luego W.\n3. Mantén cada posición 1-2 segundos.\n4. Realiza el ciclo completo.',
 'easy', true, false, true, NULL),

('Shoulder Dislocates', 'flexibility', 'shoulders', '[]',
 'Ejercicio de movilidad para mejorar la flexibilidad del hombro en todo su rango.',
 '1. Sujeta una pica o banda con agarre muy amplio.\n2. Pasa la pica por encima de la cabeza y por detrás hasta la espalda baja.\n3. Vuelve por el mismo camino.\n4. Reduce la distancia de agarre progresivamente.',
 'easy', true, false, true, NULL);

-- ─── BÍCEPS (11 ejercicios nuevos) ───────────────────────────

INSERT INTO exercises (name, category, muscle_group, secondary_muscles, description, instructions, difficulty, requires_equipment, is_unilateral, is_public, created_by) VALUES
('Curl con Barra EZ', 'strength', 'arms', '["forearms"]',
 'Curl de bíceps con barra EZ que reduce estrés en las muñecas.',
 '1. Sujeta la barra EZ con agarre supino en la curvatura.\n2. Flexiona los codos llevando la barra hacia los hombros.\n3. Mantén los codos pegados al cuerpo.\n4. Baja controladamente.',
 'easy', true, false, true, NULL),

('Curl con Mancuerna', 'strength', 'arms', '["forearms"]',
 'Curl de bíceps clásico con mancuernas que permite trabajo independiente.',
 '1. De pie con mancuernas a los lados, palmas hacia delante.\n2. Flexiona los codos alternando o simultáneamente.\n3. Sube hasta la contracción completa del bíceps.\n4. Baja controladamente.',
 'easy', true, false, true, NULL),

('Curl Martillo', 'strength', 'arms', '["forearms"]',
 'Curl con agarre neutro que trabaja braquial y braquiorradial además del bíceps.',
 '1. Sujeta las mancuernas con agarre neutro (palmas enfrentadas).\n2. Flexiona los codos sin rotar las muñecas.\n3. Sube hasta la contracción completa.\n4. Baja controladamente.',
 'easy', true, false, true, NULL),

('Curl Bayesian', 'strength', 'arms', '[]',
 'Curl en polea baja desde atrás que maximiza el estiramiento del bíceps.',
 '1. Colócate de espaldas a una polea baja con un agarre.\n2. Da un paso al frente para crear tensión.\n3. Flexiona el codo desde la posición estirada.\n4. Contrae el bíceps arriba y baja controladamente.',
 'medium', true, true, true, NULL),

('Curl en Banco Predicador', 'strength', 'arms', '["forearms"]',
 'Curl aislado en banco predicador que elimina el impulso y enfatiza la porción corta.',
 '1. Siéntate en el banco predicador con los brazos sobre la almohadilla.\n2. Sujeta la barra EZ con agarre supino.\n3. Flexiona los codos llevando la barra hacia los hombros.\n4. Baja controladamente sin extender completamente.',
 'medium', true, false, true, NULL),

('Curl Araña (Spider Curl)', 'strength', 'arms', '["forearms"]',
 'Curl boca abajo sobre banco inclinado que aísla completamente el bíceps.',
 '1. Inclínate boca abajo sobre un banco inclinado.\n2. Deja colgar los brazos con mancuernas o barra.\n3. Flexiona los codos llevando el peso hacia arriba.\n4. Contrae arriba y baja controladamente.',
 'medium', true, false, true, NULL),

('Curl Concentrado', 'strength', 'arms', '[]',
 'Curl a un brazo sentado que aísla el bíceps con máxima concentración.',
 '1. Siéntate con las piernas abiertas y apoya el codo en el interior del muslo.\n2. Sujeta una mancuerna y flexiona el codo.\n3. Contrae el bíceps arriba.\n4. Baja controladamente.',
 'easy', true, true, true, NULL),

('Curl en Polea Baja', 'strength', 'arms', '["forearms"]',
 'Curl de bíceps con polea baja para tensión constante durante todo el recorrido.',
 '1. Colócate frente a una polea baja con agarre recto o EZ.\n2. Flexiona los codos tirando el agarre hacia los hombros.\n3. Mantén los codos fijos.\n4. Baja controladamente.',
 'easy', true, false, true, NULL),

('Curl Inclinado en Banco', 'strength', 'arms', '[]',
 'Curl con mancuernas en banco inclinado que estira la porción larga del bíceps.',
 '1. Siéntate en un banco inclinado a 45° con mancuernas colgando.\n2. Flexiona los codos sin mover los hombros.\n3. Sube hasta la contracción completa.\n4. Baja controladamente.',
 'medium', true, false, true, NULL),

('Chin-Up (Dominada Supina)', 'strength', 'back', '["arms","core","forearms"]',
 'Dominada con agarre supino que enfatiza bíceps y dorsales.',
 '1. Agarra la barra con las palmas hacia ti a la anchura de los hombros.\n2. Tira de tu cuerpo hacia arriba hasta que la barbilla supere la barra.\n3. Contrae los dorsales y bíceps arriba.\n4. Baja controladamente.',
 'hard', true, false, true, NULL),

('Curl en Banco Predicador con Mancuerna', 'strength', 'arms', '["forearms"]',
 'Variante unilateral del curl predicador con mancuerna para trabajo independiente.',
 '1. Siéntate en el banco predicador con un brazo apoyado.\n2. Sujeta una mancuerna con agarre supino.\n3. Flexiona el codo llevando la mancuerna hacia el hombro.\n4. Baja controladamente.',
 'medium', true, true, true, NULL);

-- ─── TRÍCEPS (10 ejercicios nuevos) ──────────────────────────

INSERT INTO exercises (name, category, muscle_group, secondary_muscles, description, instructions, difficulty, requires_equipment, is_unilateral, is_public, created_by) VALUES
('Press Francés (Skull Crusher)', 'strength', 'arms', '["chest"]',
 'Extensión de tríceps tumbado con barra EZ que trabaja todas las cabezas del tríceps.',
 '1. Túmbate en banco plano con barra EZ y brazos extendidos.\n2. Flexiona los codos bajando la barra hacia la frente.\n3. Mantén los codos fijos apuntando al techo.\n4. Extiende los brazos hasta la posición inicial.',
 'medium', true, false, true, NULL),

('Press Francés con Mancuernas', 'strength', 'arms', '["chest"]',
 'Skull crusher con mancuernas que permite trabajo independiente de cada brazo.',
 '1. Túmbate en banco con una mancuerna en cada mano, brazos extendidos.\n2. Flexiona los codos bajando las mancuernas a los lados de la cabeza.\n3. Mantén los codos fijos.\n4. Extiende hasta arriba.',
 'medium', true, false, true, NULL),

('Extensión de Tríceps en Polea (Cuerda)', 'strength', 'arms', '[]',
 'Pushdown en polea con cuerda que permite separar las manos para máxima contracción.',
 '1. Agarra la cuerda en la polea alta.\n2. Extiende los codos empujando hacia abajo.\n3. Al final, separa las manos para contraer el tríceps.\n4. Vuelve controladamente.',
 'easy', true, false, true, NULL),

('Extensión de Tríceps en Polea (Barra)', 'strength', 'arms', '[]',
 'Pushdown clásico con barra recta o V en polea alta.',
 '1. Agarra la barra en la polea alta con agarre prono.\n2. Mantén los codos pegados al cuerpo.\n3. Extiende los codos empujando la barra hacia abajo.\n4. Vuelve controladamente sin mover los codos.',
 'easy', true, false, true, NULL),

('Extensión de Tríceps Trasnuca con Mancuerna', 'strength', 'arms', '[]',
 'Extensión overhead con mancuerna que enfatiza la porción larga del tríceps.',
 '1. De pie o sentado, sujeta una mancuerna con ambas manos detrás de la cabeza.\n2. Extiende los codos llevando la mancuerna hacia arriba.\n3. Mantén los codos cerca de la cabeza.\n4. Flexiona controladamente.',
 'medium', true, false, true, NULL),

('Extensión de Tríceps Trasnuca en Polea', 'strength', 'arms', '[]',
 'Extensión overhead en polea baja para la porción larga del tríceps con tensión constante.',
 '1. Colócate de espaldas a una polea baja con cuerda.\n2. Sujeta la cuerda detrás de la cabeza.\n3. Extiende los codos hacia arriba.\n4. Flexiona controladamente.',
 'medium', true, false, true, NULL),

('Press de Banca Agarre Cerrado', 'strength', 'arms', '["chest","shoulders"]',
 'Press de banca con agarre cerrado que transfiere la carga al tríceps.',
 '1. Túmbate en banco plano y agarra la barra con las manos separadas 20-30 cm.\n2. Baja la barra al pecho con los codos pegados al cuerpo.\n3. Empuja hasta la extensión completa.\n4. Controla la bajada.',
 'medium', true, false, true, NULL),

('Kickback de Tríceps', 'strength', 'arms', '[]',
 'Extensión de tríceps inclinado hacia delante con mancuerna.',
 '1. Inclina el torso a 45° con una mancuerna.\n2. Mantén el codo pegado al cuerpo a 90°.\n3. Extiende el codo llevando la mancuerna hacia atrás.\n4. Contrae el tríceps arriba y baja controladamente.',
 'easy', true, true, true, NULL),

('Fondos en Banco', 'strength', 'arms', '["chest","shoulders"]',
 'Fondos de tríceps apoyado en banco, accesible para todos los niveles.',
 '1. Apoya las manos en el borde de un banco detrás de ti.\n2. Baja flexionando los codos hasta 90°.\n3. Empuja hasta la extensión completa.\n4. Mantén la espalda cerca del banco.',
 'easy', false, false, true, NULL),

('Pushdown en Polea (Barra V)', 'strength', 'arms', '[]',
 'Pushdown con barra en V que coloca las muñecas en posición neutra.',
 '1. Agarra la barra V en la polea alta.\n2. Mantén los codos pegados al cuerpo.\n3. Extiende los codos empujando hacia abajo.\n4. Vuelve controladamente.',
 'easy', true, false, true, NULL);

-- ─── PIERNAS (24 ejercicios nuevos) ──────────────────────────

INSERT INTO exercises (name, category, muscle_group, secondary_muscles, description, instructions, difficulty, requires_equipment, is_unilateral, is_public, created_by) VALUES
('Sentadilla Goblet', 'strength', 'legs', '["glutes","core"]',
 'Sentadilla con mancuerna o kettlebell sujeta al pecho, ideal para aprender la técnica.',
 '1. Sujeta una mancuerna o kettlebell pegada al pecho.\n2. Baja en sentadilla con el pecho erguido.\n3. Baja hasta que los muslos estén paralelos al suelo.\n4. Sube empujando desde los talones.',
 'easy', true, false, true, NULL),

('Sentadilla Búlgara', 'strength', 'legs', '["glutes","core"]',
 'Sentadilla split con el pie trasero elevado para trabajo unilateral intenso.',
 '1. Coloca un pie en un banco detrás de ti.\n2. Con mancuernas a los lados, baja la rodilla trasera hacia el suelo.\n3. Mantén el torso erguido.\n4. Sube empujando con la pierna delantera.',
 'hard', true, true, true, NULL),

('Zancadas con Mancuernas', 'strength', 'legs', '["glutes","core"]',
 'Zancadas estáticas o alternas con mancuernas para cuádriceps y glúteos.',
 '1. De pie con mancuernas a los lados.\n2. Da un paso al frente y baja hasta que ambas rodillas estén a 90°.\n3. Empuja con la pierna delantera para volver.\n4. Alterna piernas.',
 'medium', true, true, true, NULL),

('Zancadas Caminando', 'strength', 'legs', '["glutes","core"]',
 'Zancadas caminando hacia delante para desarrollo funcional de piernas.',
 '1. Con mancuernas o barra, da un paso largo hacia delante.\n2. Baja hasta que ambas rodillas estén a 90°.\n3. Empuja para avanzar con la otra pierna.\n4. Continúa caminando.',
 'medium', true, true, true, NULL),

('Step-Up con Mancuernas', 'strength', 'legs', '["glutes","core"]',
 'Subida a cajón con mancuernas que trabaja cuádriceps y glúteos unilateralmente.',
 '1. Coloca un pie sobre un cajón o banco.\n2. Sube empujando con la pierna de arriba.\n3. Extiende la cadera y rodilla arriba.\n4. Baja controladamente con la otra pierna.',
 'medium', true, true, true, NULL),

('Prensa de Piernas', 'strength', 'legs', '["glutes"]',
 'Ejercicio en máquina de prensa para cuádriceps y glúteos con alta carga.',
 '1. Siéntate en la prensa con los pies a la anchura de los hombros.\n2. Baja la plataforma flexionando las rodillas a 90°.\n3. Empuja sin bloquear las rodillas.\n4. Mantén la espalda baja pegada al respaldo.',
 'easy', true, false, true, NULL),

('Hack Squat', 'strength', 'legs', '["glutes"]',
 'Sentadilla en máquina hack que aísla cuádriceps con soporte lumbar.',
 '1. Colócate en la máquina con los hombros bajo las almohadillas.\n2. Baja controladamente flexionando las rodillas.\n3. Baja hasta 90° o más.\n4. Sube empujando desde los talones.',
 'medium', true, false, true, NULL),

('Belt Squat', 'strength', 'legs', '["glutes","core"]',
 'Sentadilla con cinturón y polea que descarga la columna vertebral.',
 '1. Coloca el cinturón de carga en la cadera.\n2. Baja en sentadilla con el pecho erguido.\n3. La carga tira desde la cadera, no desde los hombros.\n4. Sube hasta la extensión.',
 'medium', true, false, true, NULL),

('Extensión de Cuádriceps en Máquina', 'strength', 'legs', '[]',
 'Aislamiento puro de cuádriceps en máquina de extensión.',
 '1. Siéntate en la máquina con los tobillos bajo la almohadilla.\n2. Extiende las rodillas levantando el peso.\n3. Contrae los cuádriceps arriba.\n4. Baja controladamente.',
 'easy', true, false, true, NULL),

('Femoral en Máquina Tumbado', 'strength', 'legs', '[]',
 'Curl femoral tumbado para aislamiento de isquiotibiales.',
 '1. Túmbate boca abajo con los tobillos bajo la almohadilla.\n2. Flexiona las rodillas tirando del peso hacia los glúteos.\n3. Contrae los isquiotibiales arriba.\n4. Baja controladamente.',
 'easy', true, false, true, NULL),

('Femoral en Máquina Sentado', 'strength', 'legs', '[]',
 'Curl femoral sentado que trabaja isquiotibiales en posición estirada.',
 '1. Siéntate con las piernas sobre la almohadilla superior.\n2. Flexiona las rodillas empujando la almohadilla hacia abajo.\n3. Contrae los isquiotibiales.\n4. Vuelve controladamente.',
 'easy', true, false, true, NULL),

('Peso Muerto Rumano', 'strength', 'legs', '["back","glutes","core"]',
 'Peso muerto con piernas casi rectas que enfatiza isquiotibiales y glúteos.',
 '1. Sujeta la barra con agarre prono a la anchura de los hombros.\n2. Con las rodillas ligeramente flexionadas, inclina el torso hacia delante.\n3. Baja la barra por las piernas hasta sentir estiramiento en isquiotibiales.\n4. Sube contrayendo glúteos e isquiotibiales.',
 'medium', true, false, true, NULL),

('Hip Thrust con Barra', 'strength', 'legs', '["core"]',
 'Empuje de cadera con barra para máxima activación de glúteos.',
 '1. Apoya la parte alta de la espalda en un banco.\n2. Coloca la barra sobre las caderas con almohadilla.\n3. Empuja las caderas hacia arriba contrayendo los glúteos.\n4. Baja controladamente.',
 'medium', true, false, true, NULL),

('Hip Thrust en Máquina', 'strength', 'legs', '["core"]',
 'Hip thrust en máquina específica para empuje de cadera guiado.',
 '1. Siéntate en la máquina con la espalda apoyada.\n2. Coloca los pies firmes en la plataforma.\n3. Empuja las caderas hacia arriba.\n4. Contrae los glúteos arriba y baja controladamente.',
 'easy', true, false, true, NULL),

('Glute Bridge', 'strength', 'legs', '["core"]',
 'Puente de glúteos en el suelo, accesible y efectivo para activar glúteos.',
 '1. Túmbate boca arriba con las rodillas flexionadas y pies apoyados.\n2. Empuja las caderas hacia arriba contrayendo los glúteos.\n3. Mantén una línea recta de rodillas a hombros.\n4. Baja controladamente.',
 'easy', false, false, true, NULL),

('Abducción de Cadera en Máquina', 'strength', 'legs', '[]',
 'Máquina de abducción para glúteo medio y estabilizadores de cadera.',
 '1. Siéntate en la máquina con las piernas dentro de las almohadillas.\n2. Abre las piernas empujando las almohadillas hacia fuera.\n3. Contrae los glúteos al máximo.\n4. Cierra controladamente.',
 'easy', true, false, true, NULL),

('Aducción de Cadera en Máquina', 'strength', 'legs', '[]',
 'Máquina de aducción para aductores del muslo.',
 '1. Siéntate con las piernas abiertas sobre las almohadillas.\n2. Junta las piernas apretando las almohadillas.\n3. Contrae los aductores al máximo.\n4. Abre controladamente.',
 'easy', true, false, true, NULL),

('Elevación de Gemelos de Pie', 'strength', 'legs', '[]',
 'Elevación de talones de pie para desarrollo de gemelos (gastrocnemio).',
 '1. Colócate en la máquina de gemelos de pie o en un escalón.\n2. Sube los talones lo más alto posible.\n3. Contrae los gemelos arriba.\n4. Baja controladamente estirando al máximo.',
 'easy', true, false, true, NULL),

('Elevación de Gemelos Sentado', 'strength', 'legs', '[]',
 'Elevación de gemelos sentado que enfatiza el sóleo.',
 '1. Siéntate en la máquina con las rodillas bajo las almohadillas.\n2. Sube los talones contrayendo los gemelos.\n3. Mantén la contracción arriba.\n4. Baja estirando al máximo.',
 'easy', true, false, true, NULL),

('Elevación de Gemelos en Prensa', 'strength', 'legs', '[]',
 'Elevación de gemelos usando la prensa de piernas como plataforma.',
 '1. Colócate en la prensa con solo la punta de los pies en la plataforma.\n2. Empuja con las puntas elevando los talones.\n3. Contrae los gemelos arriba.\n4. Baja controladamente.',
 'easy', true, false, true, NULL),

('Nordic Curl', 'strength', 'legs', '["core"]',
 'Curl nórdico excéntrico para fuerza extrema de isquiotibiales.',
 '1. Arrodíllate con los tobillos sujetos (compañero o máquina).\n2. Deja caer el torso hacia delante controlando con los isquiotibiales.\n3. Baja lo más lento posible.\n4. Usa las manos para impulsarte al subir si es necesario.',
 'hard', false, false, true, NULL),

('Patada de Glúteo en Polea', 'strength', 'legs', '[]',
 'Extensión de cadera en polea baja para aislamiento de glúteos.',
 '1. Engancha el tobillo a la polea baja.\n2. Apóyate en la estructura.\n3. Extiende la cadera llevando la pierna hacia atrás.\n4. Contrae el glúteo arriba y vuelve controladamente.',
 'easy', true, true, true, NULL),

('Clamshell con Banda', 'strength', 'legs', '[]',
 'Apertura de cadera con banda para activar glúteo medio.',
 '1. Túmbate de lado con una banda en las rodillas.\n2. Flexiona las rodillas a 90°.\n3. Abre la rodilla superior como una almeja.\n4. Mantén los pies juntos y baja controladamente.',
 'easy', true, true, true, NULL),

('Sentadilla con Salto', 'hiit', 'legs', '["glutes","core"]',
 'Sentadilla explosiva con salto para potencia y fuerza reactiva.',
 '1. Realiza una sentadilla con peso corporal.\n2. Desde la posición baja, salta explosivamente.\n3. Aterriza suavemente absorbiendo el impacto.\n4. Repite inmediatamente.',
 'medium', false, false, true, NULL);

-- ─── CORE / ABDOMEN (16 ejercicios nuevos) ───────────────────

INSERT INTO exercises (name, category, muscle_group, secondary_muscles, description, instructions, difficulty, requires_equipment, is_unilateral, is_public, created_by) VALUES
('Plancha (Plank)', 'strength', 'core', '["shoulders"]',
 'Ejercicio isométrico fundamental para estabilidad del core.',
 '1. Colócate en posición de plancha sobre los antebrazos.\n2. Mantén el cuerpo en línea recta de cabeza a talones.\n3. Activa abdomen, glúteos y cuádriceps.\n4. Mantén la posición el tiempo indicado.',
 'easy', false, false, true, NULL),

('Plancha Lateral', 'strength', 'core', '["shoulders"]',
 'Plancha lateral para oblicuos y estabilidad lateral del core.',
 '1. Túmbate de lado y apóyate sobre el antebrazo.\n2. Eleva las caderas formando una línea recta.\n3. Mantén la posición sin dejar caer la cadera.\n4. Repite en el otro lado.',
 'easy', false, true, true, NULL),

('Ab Wheel (Rueda Abdominal)', 'strength', 'core', '["shoulders","back"]',
 'Extensión con rueda abdominal para trabajo intenso de core.',
 '1. Arrodíllate con las manos en la rueda.\n2. Rueda hacia delante extendiendo el cuerpo.\n3. Mantén el core activado sin arquear la espalda.\n4. Tira de la rueda hacia las rodillas para volver.',
 'hard', true, false, true, NULL),

('Hanging Leg Raise', 'strength', 'core', '["forearms"]',
 'Elevación de piernas colgado en barra para abdomen inferior y flexores de cadera.',
 '1. Cuélgate de una barra de dominadas con agarre prono.\n2. Eleva las piernas rectas hasta los 90°.\n3. Baja controladamente sin balanceo.\n4. Para más dificultad, llega hasta la barra.',
 'hard', true, false, true, NULL),

('Cable Crunch', 'strength', 'core', '[]',
 'Crunch en polea alta con resistencia progresiva.',
 '1. Arrodíllate frente a una polea alta con cuerda.\n2. Sujeta la cuerda detrás de la cabeza.\n3. Flexiona el torso hacia abajo contrayendo el abdomen.\n4. Vuelve controladamente a la posición erguida.',
 'medium', true, false, true, NULL),

('Crunch en Máquina', 'strength', 'core', '[]',
 'Crunch abdominal en máquina guiada con carga ajustable.',
 '1. Siéntate en la máquina y agarra las asas.\n2. Flexiona el torso hacia delante contrayendo el abdomen.\n3. Mantén la contracción un instante.\n4. Vuelve controladamente.',
 'easy', true, false, true, NULL),

('Russian Twist', 'strength', 'core', '[]',
 'Rotación de torso sentado para oblicuos con peso o sin él.',
 '1. Siéntate con las rodillas flexionadas y los pies elevados.\n2. Inclina el torso ligeramente hacia atrás.\n3. Rota de un lado a otro tocando el suelo con las manos.\n4. Mantén el core activado durante todo el movimiento.',
 'medium', false, false, true, NULL),

('Dragon Flag', 'strength', 'core', '["back"]',
 'Ejercicio avanzado de core donde elevas todo el cuerpo recto desde un banco.',
 '1. Túmbate en un banco y sujétate por detrás de la cabeza.\n2. Eleva todo el cuerpo recto como una tabla.\n3. Baja controladamente sin tocar el banco con la espalda baja.\n4. Sube de nuevo manteniendo la rigidez.',
 'hard', true, false, true, NULL),

('Dead Bug', 'strength', 'core', '[]',
 'Ejercicio de estabilización de core alternando brazos y piernas.',
 '1. Túmbate boca arriba con brazos extendidos y rodillas a 90°.\n2. Extiende un brazo hacia atrás y la pierna contraria hacia delante.\n3. Mantén la espalda baja pegada al suelo.\n4. Vuelve y alterna.',
 'easy', false, false, true, NULL),

('Pallof Press', 'strength', 'core', '[]',
 'Press anti-rotación con polea para estabilidad del core.',
 '1. Colócate de lado a una polea a la altura del pecho.\n2. Sujeta el agarre con ambas manos al pecho.\n3. Extiende los brazos al frente resistiendo la rotación.\n4. Vuelve las manos al pecho.',
 'medium', true, false, true, NULL),

('Hollow Body Hold', 'strength', 'core', '[]',
 'Posición isométrica en forma de banana para fuerza de core completa.',
 '1. Túmbate boca arriba con brazos extendidos sobre la cabeza.\n2. Eleva piernas y hombros del suelo.\n3. Forma una curva de banana con el cuerpo.\n4. Mantén la posición apretando el abdomen.',
 'medium', false, false, true, NULL),

('Sit-Up en Banco Declinado', 'strength', 'core', '[]',
 'Sit-up con mayor rango de movimiento en banco declinado.',
 '1. Sujeta los pies en el banco declinado.\n2. Baja el torso hasta que quede por debajo de la horizontal.\n3. Sube contrayendo el abdomen.\n4. Toca las rodillas con las manos arriba.',
 'medium', true, false, true, NULL),

('Windshield Wipers', 'strength', 'core', '[]',
 'Rotación de piernas colgado para oblicuos avanzados.',
 '1. Cuélgate de una barra con las piernas elevadas a 90°.\n2. Rota las piernas de un lado a otro como limpiaparabrisas.\n3. Controla el movimiento con los oblicuos.\n4. Evita el balanceo excesivo.',
 'hard', true, false, true, NULL),

('L-Sit', 'strength', 'core', '["arms"]',
 'Posición isométrica con piernas extendidas al frente en paralelas o suelo.',
 '1. Apóyate en paralelas o en el suelo con los brazos extendidos.\n2. Eleva las piernas rectas frente a ti formando una L.\n3. Mantén la posición con el core y flexores de cadera.\n4. Aguanta el tiempo indicado.',
 'hard', false, false, true, NULL),

('Farmer''s Carry', 'strength', 'core', '["forearms","back","legs"]',
 'Caminata con carga pesada en las manos para core, agarre y fuerza general.',
 '1. Sujeta una mancuerna o kettlebell pesada en cada mano.\n2. Camina manteniendo el torso erguido.\n3. Activa el core y los hombros.\n4. Recorre la distancia indicada.',
 'medium', true, false, true, NULL),

('Suitcase Carry', 'strength', 'core', '["forearms","shoulders"]',
 'Caminata con carga en un solo lado para trabajo anti-lateral del core.',
 '1. Sujeta una mancuerna pesada en una sola mano.\n2. Camina sin inclinarte hacia el lado de la carga.\n3. Mantén el torso recto y el core activado.\n4. Cambia de mano a mitad del recorrido.',
 'medium', true, true, true, NULL);

-- ─── CARDIO / POTENCIA / FUNCIONAL (13 ejercicios nuevos) ────

INSERT INTO exercises (name, category, muscle_group, secondary_muscles, description, instructions, difficulty, requires_equipment, is_unilateral, is_public, created_by) VALUES
('Assault Bike', 'cardio', 'full_body', '[]',
 'Bicicleta de aire para cardio de alta intensidad con trabajo de brazos y piernas.',
 '1. Siéntate en la assault bike y pedalea.\n2. Empuja y tira de los brazos simultáneamente.\n3. Aumenta la intensidad con más velocidad.\n4. Mantén el ritmo el tiempo indicado.',
 'medium', true, false, true, NULL),

('Sled Push', 'strength', 'legs', '["core","shoulders"]',
 'Empuje de trineo para desarrollo de fuerza funcional y acondicionamiento.',
 '1. Coloca las manos en los agarres del trineo.\n2. Inclina el torso hacia delante.\n3. Empuja con las piernas de forma explosiva.\n4. Recorre la distancia indicada.',
 'hard', true, false, true, NULL),

('Skipping (Rodillas Altas)', 'cardio', 'legs', '["core"]',
 'Carrera en el sitio elevando las rodillas al máximo para cardio y coordinación.',
 '1. Corre en el sitio elevando las rodillas a la altura de la cadera.\n2. Mueve los brazos de forma coordinada.\n3. Mantén el core activado.\n4. Aumenta la velocidad progresivamente.',
 'easy', false, false, true, NULL),

('Jumping Jacks', 'cardio', 'full_body', '[]',
 'Ejercicio de calentamiento y cardio que trabaja todo el cuerpo.',
 '1. De pie con pies juntos y brazos a los lados.\n2. Salta abriendo piernas y subiendo los brazos.\n3. Salta volviendo a la posición inicial.\n4. Repite con ritmo constante.',
 'easy', false, false, true, NULL),

('Escaladora (Stepmill)', 'cardio', 'legs', '["glutes"]',
 'Máquina de escaleras para cardio que enfatiza glúteos y cuádriceps.',
 '1. Sube a la escaladora y agarra las barras laterales.\n2. Sube escalones a ritmo constante.\n3. Mantén el torso erguido.\n4. Ajusta la velocidad según tu nivel.',
 'medium', true, false, true, NULL),

('Clean con Barra', 'strength', 'full_body', '["legs","back","shoulders"]',
 'Levantamiento olímpico explosivo que trabaja todo el cuerpo.',
 '1. Colócate frente a la barra con los pies a la anchura de las caderas.\n2. Agarra la barra con agarre prono.\n3. Tira explosivamente extendiendo caderas y rodillas.\n4. Recibe la barra en los hombros en posición de front squat.',
 'hard', true, false, true, NULL),

('Push Press', 'strength', 'shoulders', '["legs","core","triceps"]',
 'Press de hombros con impulso de piernas para mover más carga.',
 '1. Sujeta la barra en los hombros (rack position).\n2. Flexiona ligeramente las rodillas.\n3. Extiende explosivamente las piernas y empuja la barra arriba.\n4. Baja controladamente a los hombros.',
 'medium', true, false, true, NULL),

('Snatch con Kettlebell', 'strength', 'full_body', '["shoulders","back","legs"]',
 'Arrancada con kettlebell para potencia y acondicionamiento.',
 '1. Coloca la kettlebell entre los pies.\n2. Tira explosivamente con extensión de cadera.\n3. Lleva la kettlebell directamente sobre la cabeza.\n4. Baja controladamente entre las piernas.',
 'hard', true, true, true, NULL),

('Tire Flip', 'strength', 'full_body', '["legs","back","shoulders","core"]',
 'Volteo de neumático para fuerza funcional total.',
 '1. Colócate frente al neumático en posición de peso muerto.\n2. Tira con piernas y espalda hasta levantarlo.\n3. Empuja con las manos para voltearlo.\n4. Repite.',
 'hard', true, false, true, NULL),

('Broad Jump', 'hiit', 'legs', '["glutes","core"]',
 'Salto en longitud explosivo para potencia de tren inferior.',
 '1. De pie con los pies a la anchura de las caderas.\n2. Balancea los brazos y flexiona las rodillas.\n3. Salta hacia delante lo más lejos posible.\n4. Aterriza suavemente con ambos pies.',
 'medium', false, false, true, NULL),

('Depth Jump', 'hiit', 'legs', '["glutes","core"]',
 'Salto desde cajón para fuerza reactiva y pliometría avanzada.',
 '1. De pie sobre un cajón de 30-60 cm.\n2. Deja caer hacia delante (no saltes desde el cajón).\n3. Al aterrizar, salta inmediatamente hacia arriba.\n4. Minimiza el tiempo de contacto con el suelo.',
 'hard', true, false, true, NULL),

('Lateral Bound', 'hiit', 'legs', '["glutes","core"]',
 'Salto lateral explosivo para potencia y estabilidad unilateral.',
 '1. De pie sobre una pierna.\n2. Salta lateralmente aterrizando sobre la otra pierna.\n3. Absorbe el impacto y estabiliza.\n4. Salta de vuelta al otro lado.',
 'medium', false, true, true, NULL),

('Farmer''s Walk', 'strength', 'full_body', '["forearms","core","back"]',
 'Caminata con carga pesada para agarre, core y fuerza funcional.',
 '1. Sujeta un peso pesado en cada mano.\n2. Camina con pasos cortos y controlados.\n3. Mantén los hombros bajos y el core apretado.\n4. Recorre la distancia indicada.',
 'medium', true, false, true, NULL);

-- ─── MOVILIDAD / ESTIRAMIENTOS (14 ejercicios nuevos) ────────

INSERT INTO exercises (name, category, muscle_group, secondary_muscles, description, instructions, difficulty, requires_equipment, is_unilateral, is_public, created_by) VALUES
('Child''s Pose', 'flexibility', 'back', '[]',
 'Postura de descanso que estira la espalda baja y los dorsales.',
 '1. Arrodíllate con las rodillas abiertas y los pies juntos.\n2. Siéntate sobre los talones.\n3. Extiende los brazos al frente y apoya la frente en el suelo.\n4. Mantén la posición respirando profundamente.',
 'easy', false, false, true, NULL),

('World''s Greatest Stretch', 'flexibility', 'full_body', '[]',
 'Estiramiento dinámico completo que moviliza cadera, columna y hombros.',
 '1. Da una zancada profunda al frente.\n2. Apoya la mano del mismo lado en el suelo.\n3. Rota el torso abriendo el brazo contrario hacia el techo.\n4. Vuelve y repite con la otra pierna.',
 'easy', false, true, true, NULL),

('Thoracic Rotation', 'flexibility', 'back', '["core"]',
 'Rotación torácica para mejorar la movilidad de la columna media.',
 '1. En posición de cuadrupedia, coloca una mano detrás de la cabeza.\n2. Rota el torso abriendo el codo hacia el techo.\n3. Vuelve rotando hacia abajo.\n4. Repite en ambos lados.',
 'easy', false, true, true, NULL),

('90/90 Hip Stretch', 'flexibility', 'legs', '[]',
 'Estiramiento de cadera en posición 90/90 para rotadores internos y externos.',
 '1. Siéntate con una pierna delante a 90° y otra detrás a 90°.\n2. Mantén el torso erguido.\n3. Inclínate sobre la pierna delantera.\n4. Mantén 30-60 segundos y cambia de lado.',
 'easy', false, true, true, NULL),

('Couch Stretch', 'flexibility', 'legs', '[]',
 'Estiramiento profundo de cuádriceps y psoas usando una pared o sofá.',
 '1. Coloca una rodilla en el suelo con el pie contra la pared.\n2. La otra pierna al frente en posición de zancada.\n3. Empuja la cadera hacia delante.\n4. Mantén 30-60 segundos por lado.',
 'easy', false, true, true, NULL),

('Thread the Needle', 'flexibility', 'back', '["shoulders"]',
 'Rotación torácica con enhebrado de aguja para movilidad de espalda y hombros.',
 '1. En cuadrupedia, desliza un brazo por debajo del otro.\n2. Apoya el hombro y la cabeza en el suelo.\n3. Mantén la posición sintiendo el estiramiento.\n4. Vuelve y repite con el otro lado.',
 'easy', false, true, true, NULL),

('Estiramiento de Gemelos en Pared', 'flexibility', 'legs', '[]',
 'Estiramiento de gemelos y sóleo usando una pared como soporte.',
 '1. Colócate frente a una pared con un pie adelantado.\n2. Apoya las manos en la pared.\n3. Mantén la pierna trasera recta y el talón en el suelo.\n4. Empuja la cadera hacia delante.',
 'easy', false, true, true, NULL),

('Estiramiento de Cuádriceps de Pie', 'flexibility', 'legs', '[]',
 'Estiramiento clásico de cuádriceps de pie sujetando el tobillo.',
 '1. De pie, sujeta un tobillo por detrás.\n2. Tira del talón hacia el glúteo.\n3. Mantén las rodillas juntas.\n4. Mantén 30 segundos por pierna.',
 'easy', false, true, true, NULL),

('Neck Circles', 'flexibility', 'full_body', '[]',
 'Círculos suaves del cuello para movilidad cervical.',
 '1. De pie o sentado con buena postura.\n2. Inclina la cabeza hacia un lado.\n3. Rota suavemente en un círculo completo.\n4. Repite en la dirección contraria.',
 'easy', false, false, true, NULL),

('Ankle Circles', 'flexibility', 'legs', '[]',
 'Círculos de tobillo para mejorar la movilidad articular.',
 '1. Eleva un pie del suelo.\n2. Rota el tobillo en círculos amplios.\n3. Realiza 10-15 círculos en cada dirección.\n4. Cambia de pie.',
 'easy', false, true, true, NULL),

('Deep Squat Hold', 'flexibility', 'legs', '["core"]',
 'Mantener la posición profunda de sentadilla para movilidad de cadera y tobillo.',
 '1. Baja en sentadilla profunda con los pies planos.\n2. Empuja las rodillas hacia fuera con los codos.\n3. Mantén el pecho erguido.\n4. Aguanta 30-60 segundos.',
 'easy', false, false, true, NULL),

('Frog Stretch', 'flexibility', 'legs', '[]',
 'Estiramiento de rana para aductores y movilidad de cadera.',
 '1. En cuadrupedia, abre las rodillas lo máximo posible.\n2. Apoya los antebrazos en el suelo.\n3. Empuja las caderas hacia atrás suavemente.\n4. Mantén la posición 30-60 segundos.',
 'easy', false, false, true, NULL),

('Doorway Chest Stretch', 'flexibility', 'chest', '["shoulders"]',
 'Estiramiento de pecho y hombro anterior usando un marco de puerta.',
 '1. Coloca el antebrazo en el marco de una puerta a 90°.\n2. Da un paso al frente con el pie del mismo lado.\n3. Siente el estiramiento en el pecho y hombro.\n4. Mantén 30 segundos por lado.',
 'easy', false, true, true, NULL),

('Lat Stretch en Polea', 'flexibility', 'back', '[]',
 'Estiramiento de dorsal usando una polea o barra fija.',
 '1. Agarra una barra fija o polea con un brazo.\n2. Deja caer el peso del cuerpo hacia el lado contrario.\n3. Siente el estiramiento en el dorsal.\n4. Mantén 20-30 segundos por lado.',
 'easy', true, true, true, NULL);

-- ═══════════════════════════════════════════════════════════════
-- EXERCISE ↔ EQUIPMENT LINKS
-- Vincula cada ejercicio (requires_equipment = true) con su equipo
-- del catálogo. Patrón: SELECT e.id + CROSS JOIN para cada nombre.
-- ═══════════════════════════════════════════════════════════════

-- ─── PECHO ────────────────────────────────────────────────────

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra olímpica' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
  UNION ALL SELECT 'Banco inclinado', false
  UNION ALL SELECT 'Rack / Jaula', true
) eq WHERE e.name = 'Press de Banca Inclinado con Barra';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra olímpica' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
  UNION ALL SELECT 'Banco plano', false
  UNION ALL SELECT 'Rack / Jaula', true
) eq WHERE e.name = 'Press de Banca Declinado con Barra';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Banco plano', false
) eq WHERE e.name = 'Press de Banca con Mancuernas';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Banco inclinado', false
) eq WHERE e.name = 'Press Inclinado con Mancuernas';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Banco plano', false
) eq WHERE e.name = 'Aperturas con Mancuernas';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Banco inclinado', false
) eq WHERE e.name = 'Aperturas Inclinadas con Mancuernas';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Máquina de extensiones' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Peck Deck';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Polea alta' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Polea baja', false
) eq WHERE e.name = 'Crossover en Polea';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Multipower / Smith' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Press en Máquina (Chest Press)';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Banco plano', false
) eq WHERE e.name = 'Pullover con Mancuerna';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Polea alta' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Pullover en Polea';

-- ─── ESPALDA ──────────────────────────────────────────────────

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Polea alta' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Jalón al Pecho Agarre Abierto';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Polea alta' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Jalón al Pecho Agarre Cerrado';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Polea alta' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Jalón al Pecho Agarre Neutro';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Banco plano', false
) eq WHERE e.name = 'Remo con Mancuerna Unilateral';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra olímpica' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
) eq WHERE e.name = 'Remo T';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Multipower / Smith' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Remo en Máquina Unilateral';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Multipower / Smith' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Remo en Máquina Bilateral';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Polea baja' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Remo Gironda Agarre Abierto';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Polea baja' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Remo Gironda Unilateral';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Polea alta' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Face Pull';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra olímpica' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
  UNION ALL SELECT 'Rack / Jaula', false
) eq WHERE e.name = 'Rack Pull';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra olímpica' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
) eq WHERE e.name = 'Encogimientos de Hombros con Barra';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Encogimientos de Hombros con Mancuernas';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra olímpica' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
) eq WHERE e.name = 'Remo al Mentón';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra olímpica' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
) eq WHERE e.name = 'Peso Muerto Sumo';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra olímpica' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
  UNION ALL SELECT 'Rack / Jaula', true
) eq WHERE e.name = 'Good Morning';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Banco plano' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Hiperextensión en Banco Romano';

-- ─── HOMBROS ──────────────────────────────────────────────────

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Banco plano', true
) eq WHERE e.name = 'Press Arnold';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Banco inclinado', true
) eq WHERE e.name = 'Press con Mancuernas (Hombro)';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Multipower / Smith' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Press en Máquina (Shoulder Press)';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Elevaciones Laterales con Mancuernas';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Polea baja' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Elevaciones Laterales en Polea';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Elevaciones Frontales con Mancuernas';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Discos' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Elevaciones Frontales con Disco';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Reverse Flys (Pájaro)';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Máquina de extensiones' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Reverse Flys en Máquina';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Banco inclinado', true
) eq WHERE e.name = 'YTW Raises';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Banda elástica' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Shoulder Dislocates';

-- ─── BÍCEPS ───────────────────────────────────────────────────

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra Z / EZ' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
) eq WHERE e.name = 'Curl con Barra EZ';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Curl con Mancuerna';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Curl Martillo';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Polea baja' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Curl Bayesian';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra Z / EZ' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
  UNION ALL SELECT 'Mancuernas', true
) eq WHERE e.name = 'Curl en Banco Predicador';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Banco inclinado', false
) eq WHERE e.name = 'Curl Araña (Spider Curl)';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Curl Concentrado';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Polea baja' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Curl en Polea Baja';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Banco inclinado', false
) eq WHERE e.name = 'Curl Inclinado en Banco';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra de dominadas' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Banda elástica', true
) eq WHERE e.name = 'Chin-Up (Dominada Supina)';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Curl en Banco Predicador con Mancuerna';

-- ─── TRÍCEPS ──────────────────────────────────────────────────

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra Z / EZ' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
  UNION ALL SELECT 'Banco plano', false
) eq WHERE e.name = 'Press Francés (Skull Crusher)';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Banco plano', false
) eq WHERE e.name = 'Press Francés con Mancuernas';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Polea alta' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Extensión de Tríceps en Polea (Cuerda)';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Polea alta' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Extensión de Tríceps en Polea (Barra)';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Extensión de Tríceps Trasnuca con Mancuerna';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Polea baja' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Extensión de Tríceps Trasnuca en Polea';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra olímpica' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
  UNION ALL SELECT 'Banco plano', false
  UNION ALL SELECT 'Rack / Jaula', true
) eq WHERE e.name = 'Press de Banca Agarre Cerrado';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Kickback de Tríceps';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Polea alta' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Pushdown en Polea (Barra V)';

-- ─── PIERNAS ──────────────────────────────────────────────────

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Kettlebell', true
) eq WHERE e.name = 'Sentadilla Goblet';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Banco plano', false
) eq WHERE e.name = 'Sentadilla Búlgara';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Zancadas con Mancuernas';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Barra olímpica', true
) eq WHERE e.name = 'Zancadas Caminando';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Cajón pliométrico', false
) eq WHERE e.name = 'Step-Up con Mancuernas';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Prensa de piernas' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Prensa de Piernas';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Multipower / Smith' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Hack Squat';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Polea baja' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Belt Squat';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Máquina de extensiones' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Extensión de Cuádriceps en Máquina';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Máquina de curl femoral' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Femoral en Máquina Tumbado';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Máquina de curl femoral' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Femoral en Máquina Sentado';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra olímpica' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
) eq WHERE e.name = 'Peso Muerto Rumano';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra olímpica' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
  UNION ALL SELECT 'Banco plano', false
) eq WHERE e.name = 'Hip Thrust con Barra';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Multipower / Smith' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Hip Thrust en Máquina';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Multipower / Smith' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Abducción de Cadera en Máquina';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Multipower / Smith' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Aducción de Cadera en Máquina';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Multipower / Smith' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Elevación de Gemelos de Pie';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Multipower / Smith' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Elevación de Gemelos Sentado';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Prensa de piernas' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Elevación de Gemelos en Prensa';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Polea baja' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Patada de Glúteo en Polea';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Banda elástica' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Clamshell con Banda';

-- ─── CORE ─────────────────────────────────────────────────────

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Ab wheel' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Ab Wheel (Rueda Abdominal)';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra de dominadas' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Hanging Leg Raise';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Polea alta' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Cable Crunch';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Multipower / Smith' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Crunch en Máquina';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Banco plano' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Dragon Flag';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Polea baja' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Polea alta', true
) eq WHERE e.name = 'Pallof Press';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Banco inclinado' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Sit-Up en Banco Declinado';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra de dominadas' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Windshield Wipers';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Kettlebell', true
) eq WHERE e.name = 'Farmer''s Carry';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Kettlebell', true
) eq WHERE e.name = 'Suitcase Carry';

-- ─── CARDIO / POTENCIA / FUNCIONAL ────────────────────────────

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Bicicleta estática' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Assault Bike';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Multipower / Smith' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Sled Push';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Elíptica' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Escaladora (Stepmill)';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra olímpica' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
) eq WHERE e.name = 'Clean con Barra';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Barra olímpica' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Discos', false
  UNION ALL SELECT 'Rack / Jaula', true
) eq WHERE e.name = 'Push Press';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Kettlebell' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Snatch con Kettlebell';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Multipower / Smith' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Tire Flip';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Cajón pliométrico' AS equipment_name, false AS is_optional
) eq WHERE e.name = 'Depth Jump';

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Mancuernas' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Kettlebell', true
) eq WHERE e.name = 'Farmer''s Walk';

-- ─── MOVILIDAD ────────────────────────────────────────────────

INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_name, is_optional)
SELECT e.id, eq.equipment_name, eq.is_optional FROM exercises e
CROSS JOIN (
  SELECT 'Polea alta' AS equipment_name, false AS is_optional
  UNION ALL SELECT 'Barra de dominadas', true
) eq WHERE e.name = 'Lat Stretch en Polea';

USE fitness_tracker;
SELECT COUNT(*) FROM exercises WHERE created_by IS NULL;  -- debería dar ~155
SELECT COUNT(*) FROM exercise_equipment;                   -- ahora con todos los nuevos links