# GAINZ — Aplicación web para entrenamiento de fuerza personalizado

Trabajo de Fin de Grado — Ingeniería del Software, Facultad de Informática, Universidad Complutense de Madrid.

**Autor:** Ibrahim Garcés El Bssita
**Director:** Ramón González del Campo Rodríguez Barbero
**Convocatoria:** junio 2026

---

## Descripción

GAINZ es una aplicación web para planificar, ejecutar y analizar entrenamientos de fuerza personalizados. Combina un motor de recomendación de rutinas adaptado al perfil del usuario (sexo, experiencia, objetivos, lesiones, equipamiento) con una experiencia de sesión en vivo que incluye *Smart Fill*, detección de mesetas, cálculo automático de 1RM (fórmula de Epley), récords personales y un sistema de racha y logros desbloqueables.

El proyecto es un **monorepo** con dos subproyectos:

- `backend/` — API REST en **Node.js + Express + TypeScript + MySQL**.
- `frontend/` — SPA en **React 19 + TypeScript + Vite + Tailwind**.

Autenticación delegada en **Firebase Authentication** (con modo de desarrollo sin auth para facilitar pruebas).

---

## Requisitos previos

| Herramienta | Versión mínima | Cómo instalar |
|---|---|---|
| **Node.js** | 18 LTS o superior | [nodejs.org](https://nodejs.org) |
| **pnpm** | 9+ | `npm install -g pnpm` |
| **MySQL** | 8.0+ | [mysql.com](https://dev.mysql.com/downloads/) o XAMPP |
| **MySQL Workbench** *(recomendado)* | — | Para ejecutar las migraciones cómodamente |
| **Git** | 2.x | [git-scm.com](https://git-scm.com) |

Sistema operativo: Windows 10/11, macOS o Linux. El proyecto se ha desarrollado y probado en Windows 11.

---

## Instalación paso a paso

### 1. Instalar dependencias

Desde la raíz del repositorio:

```bash
pnpm install:all
```

Esto instala dependencias en `backend/` y `frontend/` automáticamente. Alternativamente:

```bash
cd backend  && pnpm install
cd ../frontend && pnpm install
```

### 2. Crear la base de datos

Conéctate a MySQL (con MySQL Workbench, el cliente CLI o el panel de XAMPP/MAMP) y crea la base de datos:

```sql
CREATE DATABASE fitness_tracker
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
```

### 3. Ejecutar migraciones y seeds en el orden indicado

> **IMPORTANTE.** Las migraciones y los seeds deben ejecutarse **intercalados** en el orden exacto que se indica abajo. Algunas migraciones (la 002 y la 006) actualizan datos de los ejercicios y, por tanto, requieren que el seed de ejercicios ya esté cargado. Ejecutar todas las migraciones primero y todos los seeds después dejaría la base de datos en un estado parcialmente vacío (`exercise_equipment` y `secondary_muscles` sin poblar).

En MySQL Workbench: `File → Open SQL Script…`, seleccionar el archivo y pulsar el rayo amarillo (*Execute*). Ejecuta los archivos en este orden:

| Orden | Archivo | Tipo | Qué hace |
|---|---|---|---|
|  1 | `migrations/001_initial_schema.sql`               | mig.  | Crea las 11 tablas base. |
|  2 | `seeds/000_dev_user.sql`                          | seed  | Crea el usuario de desarrollo `id=1`. |
|  3 | `seeds/001_seed_exercises.sql`                    | seed  | Carga los 25 ejercicios oficiales del catálogo público. |
|  4 | `migrations/002_profile_and_equipment_catalog.sql`| mig.  | Amplía `users` (sex, experience, goals, injuries…), crea `equipment_catalog` y rellena `exercise_equipment` para los 25 ejercicios. |
|  5 | `migrations/003_equipment_catalog_name.sql`       | mig.  | Añade `catalog_name` a `equipment`. |
|  6 | `migrations/004_1rm_history.sql`                  | mig.  | Crea `exercise_1rm_history` para la gráfica de proyección de 1RM. |
|  7 | `migrations/005_birth_date.sql`                   | mig.  | Añade `birth_date` a `users`. |
|  8 | `migrations/006_secondary_muscles.sql`            | mig.  | Pobla el campo JSON `secondary_muscles` de los 25 ejercicios. |
|  9 | `seeds/002_seed_routines.sql`                     | seed  | Carga 5 rutinas oficiales públicas. |
| 10 | `seeds/004_seed_extended_exercises.sql`           | seed  | *(opcional)* Catálogo extendido de ejercicios (130 ejercicios adicionales). |

> El archivo `seeds/003_seed_test_data.sql` añade sesiones de prueba ya completadas para ver el *dashboard*, las gráficas de progreso y los logros desbloqueados sin tener que registrar tú mismo varias sesiones. **No es obligatorio** si quieres empezar la BD vacía y registrar tus propias sesiones.
>
> El archivo `seeds/004b_cleanup_duplicates.sql` es una utilidad de mantenimiento que **no forma parte del flujo de instalación**. Solo es necesario si por accidente se re-ejecuta el seed 004 dos veces y aparecen ejercicios duplicados.

### 4. Configurar variables de entorno

#### Backend

```bash
cp backend/.env.example backend/.env
```

Edita `backend/.env` con tus valores:

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=fitness_tracker
DB_USER=root
DB_PASSWORD=tu_password_real

# Modo DEV (sin Firebase): deja las 3 variables siguientes EN BLANCO.
# El backend asumirá user id=1 en cada petición.
#
# Modo PROD (con Firebase): rellénalas con un service account de Firebase Admin.
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

#### Frontend

```bash
cp frontend/.env.example frontend/.env
```

Edita `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001/api/v1

# Modo DEV: deja las 3 siguientes en blanco.
# Modo PROD: rellénalas con la config pública de Firebase.
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
```

### 5. Arrancar el proyecto

Desde la raíz:

```bash
pnpm dev
```

Esto lanza el backend en `http://localhost:3001` y el frontend en `http://localhost:5173`. Abre la segunda URL en el navegador.

Si prefieres arrancarlos por separado:

```bash
# Terminal 1
cd backend && pnpm dev

# Terminal 2
cd frontend && pnpm dev
```

### 6. Verificar que todo funciona

1. Abre `http://localhost:3001/health` → debes ver `{ "status": "ok", "database": "connected" }`.
2. Abre `http://localhost:5173` → deberías llegar al *login* o al *onboarding* (en modo DEV te lleva directo al *dashboard*).
3. Si has cargado todos los seeds: ve a `/exercises` y deberías ver 25+ ejercicios.

---

## Modo DEV vs Modo PROD

**Modo DEV (recomendado para probar el proyecto rápidamente):**

- Deja `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` vacíos en `backend/.env`.
- Deja las tres `VITE_FIREBASE_*` vacías en `frontend/.env`.
- El backend asume automáticamente el usuario con `id=1` (el de `000_dev_user.sql`).
- No hace falta crear cuenta, registrarse ni iniciar sesión: entras directo.

**Modo PROD (con Firebase real):**

- Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
- Activa **Authentication** → habilita los proveedores *Email/Password* y *Google*.
- En *Project Settings → General*, copia la configuración SDK y pégala en `frontend/.env` (las tres `VITE_FIREBASE_*`).
- En *Project Settings → Service Accounts*, descarga la clave privada JSON. Pega los tres valores correspondientes en `backend/.env` (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`).
- La `FIREBASE_PRIVATE_KEY` debe ir entre comillas dobles, con los saltos de línea literales `\n`.

---

## Estructura del proyecto

```
gainz/
├── backend/                    Subproyecto API REST
│   ├── src/
│   │   ├── config/             Configuración (BD, Firebase)
│   │   ├── controllers/        Controladores Express
│   │   ├── services/           Servicios de negocio
│   │   ├── models/             Modelos (patrón Repositorio)
│   │   ├── queries/            SQL bruto sobre mysql2
│   │   ├── routes/             Definición de endpoints
│   │   ├── middlewares/        Auth, error handler, 404
│   │   ├── types/              Tipos TypeScript
│   │   ├── utils/              Errores personalizados, helpers
│   │   └── db/
│   │       ├── migrations/     Migraciones SQL numeradas
│   │       └── seeds/          Datos iniciales
│   ├── .env.example
│   └── package.json
│
├── frontend/                   Subproyecto cliente SPA
│   ├── src/
│   │   ├── pages/              18 páginas asociadas a rutas
│   │   ├── components/         UI, layout, auth, exercises, accessibility
│   │   ├── router/             Configuración de React Router
│   │   ├── store/              Zustand (useAuthStore)
│   │   ├── hooks/              useAuth, useDebounce
│   │   ├── services/           Servicios de API (axios)
│   │   ├── types/              Tipos TypeScript
│   │   ├── utils/              labels, oneRM
│   │   ├── i18n/               Configuración + locales/es.json
│   │   ├── config/             Inicialización Firebase
│   │   └── lib/                Helpers
│   ├── .env.example
│   └── package.json
│
└── package.json                Orquesta arranque conjunto (pnpm dev)
```

---

## Comandos útiles

```bash
# Desarrollo
pnpm dev                        # Arranca backend y frontend en paralelo

# Backend
cd backend
pnpm dev                        # Arranca solo backend (puerto 3001)
pnpm test                       # Ejecuta tests unitarios (Vitest)
pnpm build                      # Compila TypeScript a dist/

# Frontend
cd frontend
pnpm dev                        # Arranca solo frontend (puerto 5173)
pnpm test                       # Ejecuta tests unitarios (Vitest)
pnpm build                      # Genera build de producción en dist/
pnpm lint                       # Lint con ESLint
```

---

## Tests

El proyecto incluye **99 pruebas unitarias** automatizadas con **Vitest**:

- **Backend (64 pruebas en 6 suites):** ExerciseService, SessionService, RoutineService, ProgressService, RoutineGeneratorService, customErrors.
- **Frontend (35 pruebas en 5 suites):** oneRM, labels, DifficultyDots, OneRMCalculator, GlowCard.

Para correrlas todas:

```bash
cd backend && pnpm test
cd ../frontend && pnpm test
```

---

## Documentación

La memoria completa del TFG (106 páginas) se entrega como documento separado (`main.pdf`), generado con LaTeX a partir del proyecto en `memoria-latex/` (no incluido en este zip de código fuente).

---

## Repositorio Git

El presente zip incluye una **copia íntegra y autosuficiente del código fuente** del proyecto. No es necesario acceder a ningún recurso externo para evaluarlo.

Adicionalmente, el código se mantiene en un repositorio Git **privado** en GitHub que conserva el historial de desarrollo (con un commit por módulo funcional, reflejando la metodología incremental descrita en la memoria). Si el evaluador desea consultar dicho historial, puede solicitar acceso de lectura al repositorio **a través del director del Trabajo de Fin de Grado**.

---

## Licencia

Código propiedad del autor. Uso académico exclusivo.

---

## Problemas conocidos y soluciones

| Problema | Solución |
|---|---|
| `Error connecting to MySQL` al arrancar el backend | Verifica que MySQL esté arrancado y que `DB_USER` / `DB_PASSWORD` en `backend/.env` sean correctos. |
| `Table 'users' doesn't exist` | Las migraciones no se han ejecutado o están incompletas. Ejecuta los 6 archivos de `backend/src/db/migrations/` en orden. |
| No aparecen ejercicios en `/exercises` | Falta ejecutar los seeds. Carga `001_seed_exercises.sql` en MySQL. |
| El *frontend* muestra error de Firebase al iniciar sesión | Modo DEV: deja las `VITE_FIREBASE_*` vacías. Modo PROD: rellena con la config de tu proyecto Firebase. |
| `EADDRINUSE: address already in use 3001` | El puerto 3001 está ocupado. Cambia `PORT` en `backend/.env` o cierra el proceso que lo usa. |

---

## Contacto

Para cuestiones sobre el código fuente: contactar con el autor (Ibrahim Garcés El Bssita) a través del director del TFG.
