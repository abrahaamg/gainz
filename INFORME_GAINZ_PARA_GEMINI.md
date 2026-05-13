# Prompt para Google Gemini Pro — Investigacion competitiva Gainz vs mercado

## INSTRUCCIONES PARA GEMINI

Eres un analista de producto especializado en aplicaciones de fitness y entrenamiento. Te voy a dar un informe exhaustivo de mi aplicacion **Gainz** (mi TFG universitario). Necesito que hagas lo siguiente:

### Tarea principal

Haz un **research extenso y detallado** comparando Gainz con las principales apps del mercado:
- **Hevy** (la mas popular para gym logging)
- **Fitbod** (la mas avanzada en IA y recomendaciones)
- **Strong** (referente en simplicidad y UX)
- **JEFIT** (comunidad y base de datos de ejercicios)
- **GymShark Training** (contenido y guias)
- **Nike Training Club** (entrenamientos guiados)
- Cualquier otra app relevante que consideres

### Lo que necesito que me entregues

1. **Tabla comparativa exhaustiva** de funcionalidades: que tiene cada app y que no. Columnas: Funcionalidad | Gainz | Hevy | Fitbod | Strong | JEFIT | Notas
2. **Funcionalidades que ellos tienen y yo NO** — priorizadas por impacto en el usuario. Para cada una:
   - Que es exactamente
   - Que app(s) la tienen
   - Nivel de dificultad de implementacion (bajo/medio/alto)
   - Prioridad recomendada para mi TFG
3. **Funcionalidades que YO tengo y ellos NO** (o que son raras en el mercado) — esto es mi diferenciacion
4. **Funcionalidades criticas que me faltan** para ser competitivo (las que un usuario esperaria si o si)
5. **Ideas innovadoras** que ninguna app tiene y que yo podria implementar para destacar

### Formato de respuesta
- Usa tablas markdown siempre que sea posible
- Se especifico: no digas "tiene tracking de progreso", di exactamente QUE trackea y COMO
- Prioriza con emojis: 🔴 critico, 🟡 importante, 🟢 nice-to-have
- Agrupa por categorias: Auth, Ejercicios, Rutinas, Sesiones, Progreso, Social, IA/Recomendaciones, UX, Gamificacion

---

## INFORME COMPLETO DE GAINZ

### 1. VISION GENERAL

**Gainz** es una aplicacion web de seguimiento de entrenamiento de fuerza y fitness. Stack: React 18 + TypeScript + Vite + Tailwind CSS (frontend) y Node.js + Express + MySQL (backend). Autenticacion con Firebase. No tiene app nativa movil — es una web app responsive.

---

### 2. SISTEMA DE AUTENTICACION Y ONBOARDING

#### Autenticacion
- Registro con email/password via Firebase Authentication
- Login con email/password
- Token Bearer en cada request al backend
- Modo DEV que bypasea Firebase para desarrollo local
- **NO tiene**: login con Google, Apple, Facebook u otros proveedores OAuth

#### Onboarding (4 pasos obligatorios tras registro)
El onboarding es un wizard de 4 pasos con barra de progreso. Hasta que no se completa, el usuario no puede acceder a la app.

**Paso 1 — Perfil fisico:**
- Username, sexo (masculino/femenino/sin especificar)
- Edad, peso (kg), altura (cm)
- Experiencia (ninguna / < 1 ano / 1-3 anos / > 3 anos)
- Nivel de fitness (principiante / intermedio / avanzado)

**Paso 2 — Objetivos:**
- Seleccion multiple de: perdida de grasa, hipertrofia, fuerza, V-shape, gluteos/piernas, cardio, atletico, fitness general, mejorar levantamientos
- El primer objetivo seleccionado se marca como "objetivo principal"
- Se pueden reordenar por prioridad

**Paso 3 — Equipamiento:**
- Catalogo cerrado de 24 equipos agrupados por categoria:
  - Peso libre: barra olimpica, mancuernas, kettlebell, discos
  - Bancos: banco plano, banco ajustable, rack, multipower
  - Maquinas: poleas, maquinas guiadas
  - Cardio: cinta, bici estatica, remo, eliptica, comba
  - Accesorios: cajon pliometrico, battle ropes, bandas elasticas, TRX, barra de dominadas, ab wheel
- Multi-seleccion con checkboxes
- Contador de items seleccionados

**Paso 4 — Disponibilidad y lesiones:**
- Dias de entrenamiento disponibles (minimo 2): lunes a domingo
- Duracion de sesion preferida: 30 / 45 / 60 / 90 minutos
- Lesiones/limitaciones (opcional): hombro, rodilla, lumbar, muneca, cadera, tobillo, cuello, codo

---

### 3. BASE DE DATOS DE EJERCICIOS

#### Estructura de cada ejercicio
- Nombre
- Categoria: strength, cardio, flexibility, HIIT, balance
- Grupo muscular principal: chest, back, legs, shoulders, arms, core, lats, upper_back, quadriceps, hamstrings, glutes, biceps, triceps, calves, forearms, full_body
- Musculos secundarios (array JSON)
- Descripcion textual
- Instrucciones paso a paso
- Dificultad: easy, medium, hard
- URL de video (opcional)
- URL de imagen (opcional)
- Requiere equipamiento (boolean)
- Es unilateral (boolean)
- Notas adicionales
- Publico/privado
- Relacion many-to-many con equipamiento necesario (tabla exercise_equipment con campo is_optional)

#### Seed inicial: 25 ejercicios
Incluye: Sentadilla con Barra, Press de Banca, Peso Muerto, Remo con Barra, Press Militar, Dominadas, Fondos en Paralelas, Curl de Biceps con Barra, Burpees, Mountain Climbers, Kettlebell Swings, Box Jumps, Battle Ropes, Sprints 20m, Pistol Squat, Single Leg Deadlift, Cat-Cow, Hip Flexor Stretch, Carrera en Cinta, Remo en Ergometro, Bicicleta Estatica, Saltar a la Comba, Estiramiento de Isquiotibiales, Sentadilla Goblet, Plancha.

#### Funcionalidades CRUD
- **Listar ejercicios**: con filtros por categoria, musculo, dificultad, requiere equipamiento, busqueda por texto. Paginacion (12 por pagina). Busqueda con debounce 300ms.
- **Ver detalle**: muestra toda la info + equipamiento necesario + calculadora 1RM integrada
- **Crear ejercicio personalizado**: formulario completo con todos los campos
- **Editar ejercicio**
- **Eliminar ejercicio**

#### Calculadora de 1RM (integrada en detalle de ejercicio)
- Formula Epley: 1RM = peso x (1 + reps/30)
- Input: peso (kg) + repeticiones (1-30)
- Output: 1RM estimado + tabla de porcentajes (50%, 60%, 70%, 75%, 80%, 85%, 90%, 95%, 100%) con:
  - Peso calculado para cada porcentaje
  - Rango de repeticiones recomendado
  - Objetivo de entrenamiento (fuerza maxima, hipertrofia, resistencia, etc.)
  - Resalta el 80% como "zona de hipertrofia"

---

### 4. SISTEMA DE RUTINAS

#### Estructura de una rutina
- Nombre, descripcion
- Objetivo: strength, cardio, weight_loss, flexibility, general, fat_loss, hypertrophy, glutes_legs, cardio_endurance, athletic, v_shape, improve_lifts, general_fitness
- Dificultad: easy, medium, hard
- Duracion estimada (minutos)
- Notas de calentamiento (texto libre)
- Notas de vuelta a la calma (texto libre)
- Publica/privada
- Veces completada (contador)
- Tags (JSON array)
- Lista ordenada de ejercicios, cada uno con:
  - Orden (drag & drop)
  - Series
  - Repeticiones O duracion (segundos) — mutuamente excluyentes
  - Descanso entre series (segundos)
  - Sugerencia de peso (kg)
  - Notas por ejercicio
  - Grupo de superserie (para agrupar ejercicios)

#### Rutinas seed (5 rutinas oficiales publicas)
1. **Full Body Principiante** — solo peso corporal, 45 min, 6 ejercicios
2. **Fuerza Basica con Barra** — tipo Starting Strength, 60 min, 5 ejercicios
3. **HIIT Express 30min** — circuito alta intensidad, 30 min, 6 ejercicios
4. **Gluteos y Piernas Intenso** — tren inferior, 50 min, 6 ejercicios
5. **Cardio y Resistencia Total** — combinado, 45 min, 6 ejercicios

#### Constructor de rutinas (Routine Builder)
- Interfaz drag-and-drop con dnd-kit
- Busqueda de ejercicios en tiempo real con debounce
- Anadir ejercicios desde resultados de busqueda
- Reordenar con arrastrar y soltar
- Configurar por ejercicio: series, reps/duracion, descanso, peso sugerido, notas
- Metadatos: nombre, descripcion, objetivo, dificultad, calentamiento, vuelta a la calma, publico/privado
- Calculo automatico de duracion estimada
- Validacion de campos requeridos

#### CRUD completo
- Listar rutinas del usuario (cards con info resumida)
- Ver detalle con lista de ejercicios y toda su configuracion
- Crear nueva rutina (builder)
- Editar rutina existente (builder pre-poblado)
- Eliminar rutina (con confirmacion modal)
- Iniciar sesion desde cualquier rutina

---

### 5. SESIONES DE ENTRENAMIENTO EN VIVO

#### Flujo de sesion
1. El usuario pulsa "Iniciar" en una rutina
2. Se crea una sesion en BD con status `in_progress`
3. Se abre la pagina de sesion en vivo

#### Interfaz de sesion en vivo
- **Cabecera**: nombre de la rutina, cronometro global (MM:SS), boton abandonar, barra de progreso (series completadas / total)
- **Panel principal** con 3 fases por ejercicio:

  **Fase 1 — Trabajo (Working):**
  - Nombre del ejercicio, categoria, musculo
  - Serie actual / total
  - Input de repeticiones (con objetivo mostrado)
  - Input de peso kg (con sugerencia mostrada)
  - Slider de RPE 1-10 con etiquetas: Facil / Moderado / Maximo
  - Input de notas (opcional)
  - Boton "Serie completada"

  **Fase 2 — Descanso (Resting):**
  - Temporizador cuenta atras grande (MM:SS)
  - Barra de progreso del descanso
  - Boton "Saltar descanso"

  **Fase 3 — Duracion (para ejercicios basados en tiempo):**
  - Cuenta atras grande
  - Barra de progreso
  - Boton "Terminar antes"

- **Sidebar lateral**: lista de ejercicios con indicador de progreso, ejercicio actual resaltado, completados con check, click para saltar a ejercicio
- **Boton "Saltar ejercicio"**: omitir un ejercicio entero
- **Boton "Terminar sesion"**: finalizar antes de completar todo

#### Al finalizar
- Modal de finalizacion:
  - Rating con estrellas (1-5)
  - Textarea para notas de la sesion
  - Boton guardar
- Redirige a pagina de resumen

#### Deteccion automatica de Personal Records (PR)
- Al registrar cada serie, el backend compara automaticamente:
  - Si weight_kg > max_weight anterior → nuevo PR de peso
  - Si reps (sin peso) > max_reps anterior → nuevo PR de repeticiones
  - Si duration > max_duration anterior → nuevo PR de duracion
- Usa `ON DUPLICATE KEY UPDATE` para atomicidad
- Devuelve flag `new_pr: true` al frontend
- **Toast de PR**: notificacion flotante en la esquina cuando se logra un PR

#### Calculo de calorias
- Formula: MET 5 x peso_kg x duracion_min / 60
- MET fijo de 5 (entrenamiento de fuerza moderado)
- Usa el peso del perfil del usuario

---

### 6. RESUMEN DE SESION (Post-workout)

Pagina dedicada tras finalizar cada sesion:
- Icono de trofeo + "Sesion completada"
- Nombre de la rutina + rating en estrellas
- **4 tarjetas de stats**: duracion, total series, volumen total (kg), calorias quemadas
- Notas de la sesion (si las hay)
- **Desglose por ejercicio**:
  - Nombre del ejercicio, peso maximo usado
  - Detalle por serie: "S1: 10 reps · 80kg · RPE 7"
  - Notas por serie (si las hay)
- Botones: volver al dashboard, ver progreso

---

### 7. SISTEMA DE PROGRESO Y ANALITICAS

#### Selector de periodo: 7 dias / 30 dias / 90 dias

#### Estadisticas de racha (Streak)
- Racha actual (dias consecutivos)
- Racha mas larga historica
- Total de entrenamientos completados
- Total de minutos entrenados
- Logica de racha:
  - Mismo dia = no cambia
  - Dia consecutivo = incrementa
  - Mas de 1 dia sin entrenar = reset a 1

#### Sistema de Badges (9 logros)
| Badge | Condicion |
|-------|-----------|
| Primer entrenamiento | 1+ entrenamientos |
| Cinco entrenamientos | 5+ entrenamientos |
| Veinte entrenamientos | 25+ entrenamientos |
| Racha de 3 dias | 3+ dias consecutivos |
| Racha de 7 dias | 7+ dias consecutivos |
| Racha de 30 dias | 30+ dias consecutivos |
| 60 minutos totales | 60+ min acumulados |
| 300 minutos totales | 300+ min acumulados |
| Coleccionista de PRs | 10+ personal records |

Visualizacion: grid de badges con iconos, ganados en color / no ganados en escala de grises.

#### Graficas (Recharts)
1. **Frecuencia de entrenamiento**: grafica de barras — sesiones por dia
2. **Volumen total (kg)**: grafica de lineas — kg levantados por dia
3. **Duracion**: grafica de area con gradiente — minutos por dia
4. **Distribucion muscular**: grafica radar — series por grupo muscular

#### Progresion por ejercicio
- Dropdown para seleccionar ejercicio (solo los que el usuario ha entrenado)
- Grafica de lineas: peso maximo por dia a lo largo del tiempo

#### Tabla de Personal Records
- Columnas: Ejercicio, Tipo de record (peso max / reps max / duracion max), Valor, Fecha
- Todos los PRs del usuario

---

### 8. SISTEMA DE EQUIPAMIENTO

#### Equipamiento del usuario
- Lista de equipamiento agrupado por categoria
- Por cada equipo: nombre, ubicacion (casa/gimnasio/exterior), cantidad, peso (kg)
- Eliminar equipamiento individual

#### Catalogo cerrado (24 items en 5 categorias)
- **Peso libre**: Barra olimpica, Mancuernas, Kettlebell, Discos
- **Bancos/Racks**: Banco plano, Banco ajustable, Rack de sentadillas, Multipower
- **Maquinas**: Poleas/Cable, Maquinas guiadas
- **Cardio**: Cinta de correr, Bicicleta estatica, Remo ergometro, Eliptica, Comba de saltar
- **Accesorios**: Cajon pliometrico, Battle Ropes, Bandas elasticas, TRX, Barra de dominadas, Ab Wheel, Paralelas

#### Anadir equipamiento
- Modal con catalogo navegable por categoria
- Opcion de equipo personalizado (nombre libre)
- Campos: ubicacion, cantidad, peso, notas

#### Metricas de accesibilidad
- **Ejercicios de peso corporal**: contador + lista desplegable de ejercicios que no requieren equipo
- **Ejercicios accesibles**: contador + lista de ejercicios que puede hacer con su equipo actual
- La logica: un ejercicio es accesible si (a) no requiere equipamiento, o (b) el usuario tiene TODO el equipamiento obligatorio (is_optional=false)

---

### 9. MOTOR DE GENERACION DE RUTINAS (IA/Algoritmo)

Este es el sistema de recomendaciones personalizado. No usa IA generativa — es un algoritmo deterministico basado en reglas.

#### Entrada
- Perfil completo del usuario: sexo, edad, nivel, experiencia, objetivo principal, objetivos secundarios, dias disponibles, duracion de sesion, lesiones

#### Algoritmo paso a paso

**1. Filtrado de ejercicios accesibles:**
- Solo ejercicios de peso corporal + los que tienen todo el equipo obligatorio del usuario

**2. Exclusion por lesiones (mapa de exclusion):**
| Lesion | Musculos excluidos |
|--------|-------------------|
| Hombro | shoulders, chest |
| Rodilla | quadriceps, legs |
| Lumbar | back, core |
| Muneca | forearms, arms |
| Cadera | glutes, hamstrings |
| Tobillo | calves, legs |
| Cuello | shoulders (parcial) |
| Codo | biceps, triceps |

**3. Filtrado por dificultad (segun experiencia):**
- Sin experiencia → easy
- < 1 ano → easy + medium
- 1-3 anos → medium
- 3+ anos → medium + hard

**4. Generacion de split semanal (segun dias disponibles):**
| Dias | Split |
|------|-------|
| 1-2 | Full Body A + B |
| 3 | Push / Pull / Legs |
| 4 | Upper A + B / Lower A + B |
| 5 | Push / Pull / Legs / Upper / Lower+Core |
| 6+ | Push A + B / Pull A + B / Legs A + Legs B+Core |

**5. Parametros por objetivo:**
| Objetivo | Series | Reps | Descanso | Ejercicios/dia |
|----------|--------|------|----------|----------------|
| Fuerza | 4-5 | 3-6 | 180s | 5 |
| Hipertrofia | 3-4 | 8-12 | 90s | max |
| Perdida de grasa | 3 | 12-15 | 45s | max |
| Gluteos/piernas | 3-4 | 10-15 | 75s | max |
| Cardio | 3 | 15-20 | 30s | max |
| Atletico | 3-4 | 6-10 | 90s | max |
| General | 3 | 10-12 | 60s | max |

**6. Enfasis por sexo:**
- Mujer: prioriza gluteos, isquiotibiales, core
- Hombre con objetivo V-shape: prioriza dorsales, espalda, hombros

**7. Seleccion de ejercicios por dia:**
- Filtra por grupos musculares del split del dia
- Ordena por enfasis (musculos priorizados primero)
- Ordena por categoria: strength > HIIT > cardio > balance > flexibility
- Selecciona hasta N ejercicios por dia
- Para cardio: usa duracion (120, 180, 300, 600 seg) en vez de reps

**8. Output:** 3-6 rutinas generadas con nombre, descripcion, objetivo, dificultad, duracion estimada, calentamiento, vuelta a la calma, etiqueta del dia, lista de ejercicios.

#### Acciones del usuario
- **Ver recomendaciones**: tarjetas expandibles con detalle de cada rutina generada
- **Aceptar una rutina**: la guarda en "Mis Rutinas"
- **Aceptar todas**: guarda todas las rutinas generadas de golpe
- **Regenerar**: vuelve a generar nuevas rutinas
- Resumen: muestra sesiones semanales, objetivo, nivel de dificultad

#### Recomendaciones por equipamiento (independiente del generador)
- Busca rutinas publicas de otros usuarios
- Calcula % de compatibilidad = ejercicios compatibles / total ejercicios x 100
- Filtra las que tienen >= 50% de compatibilidad
- Ordena por compatibilidad (desc) y luego por veces completadas (desc)
- Maximo 10 resultados
- Filtros opcionales: objetivo, dificultad

---

### 10. INTERFAZ Y EXPERIENCIA DE USUARIO

#### Diseno visual
- **Paleta**: neutros (neutral-50 a neutral-900) + color acento dorado (#F5C400)
- **Estilo**: limpio, minimalista, tarjetas con bordes y sombras suaves
- **Tipografia**: monospace
- **Navbar**: fija, fondo oscuro (neutral-900), logo GAINZ, 6 items de navegacion + logout
- **Responsive**: mobile-first, iconos siempre visibles, labels ocultos en movil

#### Componentes UI reutilizables
- Cards con hover (elevacion + glow dorado)
- Botones: primary (dorado), secondary (outlined), danger (rojo)
- Chips/tags seleccionables
- Inputs con ring de focus dorado
- Badges de dificultad coloreados
- Modales de confirmacion
- Toasts de notificacion (PR logrado)
- Barras de progreso
- Spinners de carga

#### Navegacion (6 secciones principales)
1. Dashboard (inicio)
2. Ejercicios
3. Rutinas
4. Progreso
5. Equipamiento
6. Recomendaciones

---

### 11. DASHBOARD

- **Grid de estadisticas**: racha actual, total entrenamientos, sesiones esta semana, minutos totales
- **Grafica de actividad**: barras de sesiones por dia (ultimos 30 dias) con Recharts
- **Rutinas recientes**: 5 rutinas mas recientes con: nombre, dificultad, objetivo, duracion, ejercicios, veces completada, boton "Iniciar"
- **Accesos rapidos**: 4 botones a Ejercicios, Rutinas, Progreso, Equipamiento
- Estado vacio con enlace a crear primera rutina

---

### 12. FUNCIONALIDADES QUE NO TIENE GAINZ (para contexto de la comparativa)

- **NO tiene app movil nativa** (es web responsive)
- **NO tiene login social** (Google, Apple, Facebook)
- **NO tiene recuperacion muscular** (tipo Fitbod: "biceps al 50%")
- **NO tiene historial de sesiones** (pagina /history) — los datos se guardan pero no hay UI
- **NO tiene componente social** (seguir usuarios, compartir rutinas, feed, likes)
- **NO tiene videos/animaciones de ejercicios** (solo campo URL opcional)
- **NO tiene integracion con wearables** (Apple Watch, Garmin, etc.)
- **NO tiene temporizador de descanso configurable global** (solo por ejercicio en la rutina)
- **NO tiene planificacion periodizada** (mesociclos, deloads programados)
- **NO tiene tracking de medidas corporales** (perimetros, fotos de progreso)
- **NO tiene notas por sesion en el historial** (se guardan pero no hay pagina)
- **NO tiene sobrecarga progresiva automatica** (aviso de subir peso)
- **NO tiene modo offline**
- **NO tiene exportacion de datos** (CSV, PDF)
- **NO tiene notificaciones push**
- **NO tiene dark mode**
- **NO tiene internacionalizacion** (solo espanol)
- **NO tiene backup/sync entre dispositivos** (depende de login)
- **NO tiene integracion con Apple Health / Google Fit**
- **NO tiene sistema de plantillas de rutinas de la comunidad**
- **NO tiene chat o soporte in-app**
- **NO tiene musica integrada** (Spotify, Apple Music)
- **NO tiene fotos de progreso corporal**
- **NO tiene medicion de volumen semanal por grupo muscular** (la tiene por sesion pero no acumulada)
- **NO tiene sugerencia de peso basada en rendimiento anterior**
- **NO tiene deteccion de estancamiento** (plateaus)
- **NO tiene deload automatico**
- **NO tiene warmup sets automaticos**
- **NO tiene tracking de cardio avanzado** (distancia, pace, zonas HR)

---

### 13. DATOS TECNICOS ADICIONALES

- **BD**: MySQL con tablas: users, exercises, routines, routine_exercises, equipment, exercise_equipment, equipment_catalog, sessions, session_exercises, streaks, personal_records
- **Autenticacion**: Firebase Auth + JWT Bearer tokens
- **Estado frontend**: Zustand (store de auth)
- **Graficas**: Recharts (barras, lineas, area, radar)
- **Drag & drop**: dnd-kit
- **HTTP client**: Axios con interceptor de token
- **Paginacion**: server-side, configurable
- **Idioma actual**: Espanol (toda la UI)

---

## RESUMEN PARA GEMINI

Mi app Gainz tiene un sistema solido de:
- Onboarding completo con perfil detallado
- CRUD completo de ejercicios con filtros y calculadora 1RM
- Constructor de rutinas con drag-and-drop
- Sesiones en vivo con cronometro, temporizador de descanso, RPE y deteccion de PRs
- Progreso con 4 tipos de graficas + radar muscular + progresion por ejercicio
- Sistema de rachas y 9 badges/logros
- Equipamiento con catalogo cerrado y calculo de ejercicios accesibles
- Motor de generacion de rutinas personalizadas (no IA generativa, algoritmo deterministico basado en reglas: split por dias, parametros por objetivo, enfasis por sexo, exclusion por lesiones, filtrado por equipo)

Lo que necesito es saber:
1. Que funcionalidades criticas me faltan vs Hevy/Fitbod/Strong/JEFIT
2. Que tengo yo que sea raro o inexistente en la competencia
3. Que deberia priorizar implementar para un TFG competitivo
4. Ideas innovadoras que me diferencien

Se especifico, usa tablas, y prioriza con 🔴🟡🟢.
