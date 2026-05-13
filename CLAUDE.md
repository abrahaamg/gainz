# Gainz — Notas del proyecto

## Stack
- Backend: Node.js + TypeScript + Express + MySQL (mysql2) — puerto 3001
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS — puerto 5173
- Package manager: pnpm
- BD: `fitness_tracker` (no `gainz`)
- Usuario dev: id=1, sin auth real (Firebase vacío)

## Convenciones UI / Frontend

### Idioma
- Todo el código, comentarios y comunicación en **español**
- App monolingüe en español. `react-i18next` está configurado con un único locale (`locales/es.json`) — la arquitectura permite añadir más idiomas en el futuro creando nuevos JSONs, pero no hay toggle de idioma en la UI

### Arquitectura de componentes
- Alias de imports: `@/` → `src/` (configurado en `vite.config.ts` + `tsconfig.app.json`)
- Utilidad `cn()` en `@/lib/utils.ts` (clsx + tailwind-merge) para merge condicional de clases
- Componentes reutilizables en `src/components/ui/` — nunca código raw repetido en páginas
- Dependencias UI: `framer-motion` (animaciones), `clsx` + `tailwind-merge` (clases), `bootstrap-icons` (iconos), `recharts` (gráficas)
- Patrón: cada componente UI acepta `className?` como prop para composición

### Componentes UI existentes (`src/components/ui/`)
| Componente | Propósito |
|---|---|
| `AnimatedHero` | Hero del dashboard con texto rotativo animado (framer-motion) |
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

## Migraciones pendientes de ejecutar
Ejecutar en MySQL Workbench en este orden:
1. `backend/src/db/migrations/002_profile_and_equipment_catalog.sql` — perfil ampliado + catálogo de equipo + seed exercise_equipment
2. `backend/src/db/seeds/002_seed_routines.sql` — 5 rutinas oficiales de Gainz
3. `backend/src/db/migrations/003_equipment_catalog_name.sql` — columna `catalog_name` en equipment para vincular equipo personalizado al catálogo
4. `backend/src/db/migrations/004_1rm_history.sql` — tabla `exercise_1rm_history` para gráfica de proyección de 1RM
5. `backend/src/db/migrations/005_birth_date.sql` — columna `birth_date` en users (reemplaza edad estática por fecha de nacimiento con cálculo automático)
6. `backend/src/db/migrations/006_secondary_muscles.sql` — poblar `secondary_muscles` JSON para los 25 ejercicios del seed

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
