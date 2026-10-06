# Gainz — Notas del proyecto

## Stack
- Backend: Node.js + TypeScript + Express + MySQL (mysql2) — puerto 3001
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS — puerto 5173
- Package manager: pnpm
- BD: `fitness_tracker` en local (no `gainz`); en producción (TiDB Cloud) la que diga `DB_NAME`
- Usuario dev: id=1, sin auth real (Firebase vacío)

## Arquitectura backend
- Capas: `routes` → `controllers` → `services` → `queries` (SQL con mysql2). **No hay capa `models`**: los services llaman directamente a `queries/*`
- Controladores envueltos con `asyncHandler` (`utils/functions.ts`), sin try/catch
- Respuestas de éxito: `{ data }` (más metadatos al mismo nivel si hace falta, p. ej. `pagination`). Errores: `{ status: 'error', message }` vía `ErrorHandler`

## Convenciones UI / Frontend

### Idioma
- Todo el código, comentarios y comunicación en **español**
- App monolingüe en español. `react-i18next` está configurado con un único locale (`locales/es.json`) — la arquitectura permite añadir más idiomas en el futuro creando nuevos JSONs, pero no hay toggle de idioma en la UI

### Arquitectura de componentes
- Alias de imports: `@/` → `src/` (configurado en `vite.config.ts` + `tsconfig.app.json`)
- Utilidad `cn()` en `@/lib/utils.ts` (clsx + tailwind-merge) para merge condicional de clases
- Componentes reutilizables en `src/components/ui/` — nunca código raw repetido en páginas
- Dependencias UI: animaciones en CSS (sin framer-motion), `clsx` + `tailwind-merge` (clases), `bootstrap-icons` (iconos), `recharts` (gráficas)
- Patrón: cada componente UI acepta `className?` como prop para composición

### Componentes UI existentes (`src/components/ui/`)
| Componente | Propósito |
|---|---|
| `AnimatedHero` | Hero del dashboard con texto rotativo animado (CSS) |
| `DifficultyDots` | 1-3 puntos de color según dificultad (green/amber/red) |

### Sistema de diseño (Tailwind + CSS)
- Estilo Apple/Linear: bordes redondeados (`rounded-apple` = 2rem), sombras suaves, pill buttons
- Degradado dorado en botones: `btn-primary` usa `linear-gradient` con glow
- Headers de página: clase `.header-gradient` (degradado oscuro con glow dorado `::after`)
- Animaciones smooth: `.dropdown-panel` con `grid-template-rows` para expand/collapse
- Hover: `.card-hover` (lift -4px), `.glow-hover` (lift + glow dorado)
- Glassmorphism: `.glass-modal` para modales
- Tipografías: Inter (sans), Cormorant Garamond (display/logo italic)
- Colores accent: `#F5C400` (dorado), `#C9A200` (oscuro), `#FFF3C4` (claro)

## Arrancar el proyecto
```bash
# Desde la raíz
pnpm dev

# O por separado
cd backend && pnpm dev
cd frontend && pnpm dev
```

## Migraciones y seeds
Se aplican con el runner de `backend/src/db/` (desde `backend/`, contra la BD de `DB_NAME`):
- `pnpm db:migrate` — aplica en orden los `.sql` de `src/db/migrations/` que falten y los apunta en `schema_migrations` (nombre, aplicada_en)
- `pnpm db:seed` — lo mismo con `src/db/seeds/`, apuntados en `schema_seeds`. Los seeds son además idempotentes: re-ejecutarlos no duplica nada
- `pnpm db:setup` — migrate + seed. Es lo que se usa para montar una BD vacía (producción en TiDB, o una local nueva)
- `--baseline` (`pnpm db:migrate --baseline`, `pnpm db:seed --baseline`) — registra como aplicados los ficheros pendientes **sin ejecutarlos**. Solo para una BD que ya los tenía aplicados a mano
- La BD local `fitness_tracker` ya está registrada (001-009 con `--baseline`)
- `010_routine_exercise_set_plan.sql` añade `routine_exercises.set_plan` (JSON NULL, plan de reps/peso por serie). Se aplica con `pnpm db:migrate` normal, sin `--baseline`

Reglas para ficheros nuevos:
- Migración nueva = fichero nuevo con el siguiente número (`010_...sql`). Nunca editar una ya aplicada
- Sin `USE`, sin `DELIMITER` ni procedimientos almacenados (TiDB no los admite) y sin el nombre de la BD escrito: siempre `DATABASE()`
- El fichero se manda entero en una sola llamada, así que puede llevar varias sentencias
- Los datos de demo (`src/db/seeds/demo/003_seed_test_data.sql`) no los aplica `db:seed`: se cargan a mano solo en local

## Tests
- `pnpm test` — unitarios (mocks, sin BD)
- `pnpm test:integration` — contra MySQL real, en la BD `fitness_tracker_test` (se borra y se monta con `db:setup` en cada ejecución; nunca toca `fitness_tracker`). Coge host/usuario/contraseña del `.env`. Si no hay MySQL, se saltan
- En los de integración, la cabecera `x-test-user-id` elige el usuario sin Firebase. Solo funciona con `NODE_ENV=test`

## Flujo de onboarding
- `/register` → crea cuenta (Firebase en producción, skip en DEV)
- `/onboarding` → 4 pasos obligatorios: Perfil → Objetivos → Equipamiento → Disponibilidad
- `ProtectedRoute` redirige a `/onboarding` si `onboarding_done = false`
- En DEV_MODE, `useAuthInit` carga `mysqlUser` desde `GET /auth/` automáticamente

## Sistema de recomendaciones
- `GET /api/v1/recommendations/generate` — genera rutinas personalizadas según perfil
- `POST /api/v1/recommendations/accept` — guarda una rutina generada
- `POST /api/v1/recommendations/accept-all` — guarda todas las rutinas generadas
- Motor en `RoutineGeneratorService.ts`:
  - Splits: Full Body (2d), PPL (3d), Upper/Lower (4d), PPL+UL (5d), PPL x2 (6d)
  - Parámetros por objetivo: series, reps, descanso, número de ejercicios
  - Énfasis por sexo (mujer: glúteos; hombre V-shape: espalda/hombros)
  - Exclusión por lesiones (mapeo lesión → grupos musculares)
  - Solo ejercicios accesibles (peso corporal + equipo del usuario)

## Checklist de pruebas funcionales

- [ ] `localhost:3001/health` → `{ status: "ok", database: "connected" }`
- [ ] `localhost:5173` → redirige a `/onboarding` si no ha hecho onboarding
- [ ] `/onboarding` → 4 pasos, al final redirige al Dashboard
- [ ] `/exercises` → lista los 25 ejercicios del seed
- [ ] `/exercises/1` → muestra detalle + calculadora 1RM funciona (introduce peso y reps)
- [ ] `/exercises/new` → crear ejercicio nuevo y que aparezca en la lista
- [ ] `/routines/new` → crear rutina con al menos 2 ejercicios y guardar
- [ ] `/routines` → aparece la rutina recién creada + las oficiales seed
- [ ] `/routines/:id` → muestra detalle de la rutina con sus ejercicios
- [ ] Iniciar sesión desde detalle de rutina → redirige a `/session/:id`
- [ ] Sesión en vivo → registrar series/reps y finalizar
- [ ] `/session/:id/summary` → muestra resumen de la sesión
- [ ] `/progress` → carga gráficas y rachas (puede estar vacío si no hay sesiones)
- [ ] `/equipment` → selector de catálogo cerrado (25 items) + equipo personalizado
- [ ] `/equipment` → añadir un equipo y ver que el contador de ejercicios accesibles sube
- [ ] `/recommendations` → genera rutinas personalizadas según perfil y equipo
- [ ] `/recommendations` → "Aceptar todo" guarda las rutinas en Mis Rutinas
- [ ] `/recommendations` → "Regenerar" genera nuevas rutinas

## Pendiente

- [ ] **Grado de implicación muscular (alta/media/baja)** — No existe campo `degree` ni tabla `exercise_muscles` para indicar la implicación de cada músculo en un ejercicio. Requiere migración de BD + actualizar queries + UI
