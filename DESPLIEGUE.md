# Plan de despliegue — TFG App Rutinas

> **Documento dirigido a Claude Code**. Este archivo describe la tarea completa de preparar el proyecto para un despliegue gratuito en producción (Vercel + Render + TiDB Cloud).
>
> **CRÍTICO**: Todo el trabajo se hace sobre un **REPOSITORIO NUEVO Y SEPARADO**, no sobre el repo del TFG entregado. El repo original NO se toca: ni rama nueva, ni commits, ni archivos modificados, NADA. Se queda exactamente como está.

---

## ⚠️ REGLA #0 — Esto es una COPIA, no el repo original

El código actual del repositorio **es el TFG entregado** y debe quedar **literalmente intocado**. Para desplegar vamos a:

1. Crear un **repositorio nuevo y completamente independiente** en GitHub (p.ej. `tfg-rutinas-deploy`).
2. Copiar el contenido del TFG ahí.
3. Trabajar EXCLUSIVAMENTE sobre ese repo nuevo.

**No** vas a:
- ❌ Crear una rama nueva en el repo original.
- ❌ Hacer commits en el repo original.
- ❌ Modificar archivos en la carpeta del repo original.
- ❌ Tocar el `git remote` del repo original.

El TFG entregado vive en una carpeta. La copia para despliegue vive en **otra carpeta distinta, con otro `.git`, apuntando a otro repo de GitHub**. Son dos cosas físicamente separadas.

**Antes de modificar absolutamente nada**, ejecuta la Fase 0 completa y verifica con `pwd` y `git remote -v` que estás trabajando en la copia, no en el original. Si la Fase 0 falla por cualquier motivo, **detente y avisa al usuario** antes de continuar.

---

## Contexto y objetivo

**Qué hay ahora:**

- Monorepo con dos subproyectos independientes: `backend/` (Node 18 + Express 4 + TypeScript + mysql2/promise + Firebase Admin) y `frontend/` (React 19 + Vite + TypeScript + Tailwind).
- Backend escucha en :3001 bajo `/api/v1`, conecta a MySQL 8 local (XAMPP/Workbench) vía connection pool, autentica con Firebase Admin SDK verificando JWTs del cliente.
- Frontend es SPA pura servida por Vite en :5173 en dev. Build de producción genera `dist/` estático (~1.2 MB / 370 KB gzip). Comunica con backend vía Axios con interceptor que inyecta el id token de Firebase.
- BD: 12 tablas relacionadas, FKs, seeds de 25 ejercicios + 5 rutinas + 25 equipamientos (y seed extendido opcional con 130 ejercicios más).
- Firebase Auth en modo PROD ya configurado (proyecto Firebase real con email/password + Google sign-in).
- Tests: 99/99 pasando en Vitest. Builds de producción de ambos compilan sin errores.

**Qué queremos:**

- Desplegar la app **gratis y sin tarjeta de crédito** para uso personal desde el móvil (entrenamientos en el gym).
- Aceptable que el backend se duerma tras 15 min de inactividad y tarde 30-60s en despertar (cold start).
- Idealmente PWA instalable en el móvil.

**Stack de despliegue:**

| Componente | Servicio | Notas |
|---|---|---|
| Frontend | **Vercel** (Hobby plan) | Free, sin tarjeta, deploy automático desde GitHub |
| Backend | **Render** (Free Web Service) | Free, sin tarjeta, cold start tras 15 min idle |
| Base de datos | **TiDB Cloud Starter** | MySQL-compatible, 5 GiB free, sin tarjeta, sin expiración |
| Auth | **Firebase** (ya configurado) | Sin cambios |

---

## Fase 0 — Crear repositorio copia (HACER PRIMERO, NO SALTAR)

El objetivo de esta fase es tener un **repo nuevo, físicamente separado**, que sea sobre el que trabajemos. Cuando termines la Fase 0, deben existir DOS carpetas:

- `~/proyectos/tfg-original/` ← el TFG entregado, intocado, conectado a su repo original de GitHub.
- `~/proyectos/tfg-rutinas-deploy/` ← la copia, conectada a un repo NUEVO de GitHub. Aquí va a vivir todo el trabajo de despliegue.

(Los nombres son ilustrativos; adáptalos a la estructura real del usuario.)

### 0.1 Verificar estado del repo original

```bash
cd /ruta/al/tfg-original
pwd                       # confirma que estás donde crees
git status                # debe estar limpio
git log --oneline -5      # snapshot del estado entregado
git remote -v             # anota la URL del repo original
```

**Si `git status` muestra cambios sin commitear**: avisa al usuario y para. El TFG entregado debe quedar tal cual, con working tree limpio.

### 0.2 (Opcional pero recomendado) Tag de respaldo en el repo original

Marca el commit del entregue para tener un punto de referencia permanente:

```bash
git tag -a tfg-entrega-v1.0 -m "TFG entregado, version final, intocable"
git push origin tfg-entrega-v1.0   # solo si tiene remote
```

Esto **no modifica el código**, solo añade un tag. Es seguro hacerlo sobre el repo original.

### 0.3 Crear el repo nuevo en GitHub

**Esto lo hace el usuario humano, no Claude Code.** Pide al usuario que:

1. Vaya a https://github.com/new
2. Cree un repositorio **vacío** (sin README, sin .gitignore, sin license — completamente vacío) llamado por ejemplo `tfg-rutinas-deploy`.
3. Lo deje como Public o Private según prefiera (Private vale; Vercel y Render funcionan con repos privados).
4. Copie la URL HTTPS o SSH del nuevo repo y te la dé.

**No sigas hasta tener esa URL.** Si el usuario no responde, espera.

### 0.4 Crear la copia local apuntando al repo nuevo

A partir de aquí depende de si el TFG original ya está en GitHub o solo en local.

#### Caso A — El TFG ya está en GitHub (lo más probable)

Clona el original a una carpeta NUEVA, luego cambia el remote para que apunte al repo nuevo:

```bash
cd ~/proyectos          # o donde esté tu workspace
git clone <URL-DEL-REPO-ORIGINAL> tfg-rutinas-deploy
cd tfg-rutinas-deploy

# Quitar el remote del repo original
git remote remove origin

# Apuntar al repo nuevo
git remote add origin <URL-DEL-REPO-NUEVO>

# Subir
git branch -M main       # asegurar que la rama se llama 'main'
git push -u origin main
```

Esto preserva el historial de commits del TFG, pero el repo es ahora completamente independiente: vive en otra URL de GitHub, y `git push` aquí **nunca** llega al repo original.

#### Caso B — El TFG solo está en local (sin GitHub)

Copia los archivos, inicializa git nuevo desde cero:

```bash
cd ~/proyectos
cp -r tfg-original tfg-rutinas-deploy
cd tfg-rutinas-deploy
rm -rf .git              # historia limpia (el original conserva la suya)
git init
git add -A
git commit -m "Initial commit: copia del TFG entregado para despliegue"
git branch -M main
git remote add origin <URL-DEL-REPO-NUEVO>
git push -u origin main
```

### 0.5 VERIFICACIÓN CRÍTICA — confirmar que estás en la copia

Antes de modificar ningún archivo, ejecuta y verifica:

```bash
pwd
# Debe imprimir algo como: /home/usuario/proyectos/tfg-rutinas-deploy
# NUNCA debe imprimir la ruta del original.

git remote -v
# Debe imprimir la URL del repo NUEVO (tfg-rutinas-deploy), NO la del original.
```

**Si `pwd` muestra la carpeta del original, O `git remote -v` apunta al repo original: PARA INMEDIATAMENTE.** No sigas. Algo fue mal en los pasos 0.3-0.4 y modificar archivos aquí tocaría el TFG entregado.

### 0.6 Verificar builds y tests en la copia

```bash
cd backend && pnpm install && pnpm test && pnpm build
cd ../frontend && pnpm install && pnpm test && pnpm build
```

**Si algo falla aquí**, para y avisa. La copia debe compilar y testear exactamente igual que el original. Si no, es que la copia se hizo mal.

### 0.7 Confirmar al usuario antes de continuar

Una vez completados los pasos 0.1–0.6, di explícitamente al usuario:

> ✅ Fase 0 completada.
> - Repo original intacto en `~/proyectos/tfg-original/` apuntando a `<URL-original>`.
> - Repo copia creado en `~/proyectos/tfg-rutinas-deploy/` apuntando a `<URL-nuevo>`.
> - Tag `tfg-entrega-v1.0` creado en el original (si aplica).
> - Builds OK, tests 99/99 pasando en la copia.
>
> Voy a continuar con la Fase 1, trabajando exclusivamente en la copia.

**Espera confirmación explícita** antes de seguir.

---

## Fase 1 — Backend: cambios para producción

### 1.1 Adaptar el pool de conexiones MySQL para TiDB Cloud

TiDB Cloud exige **conexión TLS** y usa **puerto 4000** (no el 3306 por defecto). El cambio es mínimo: añadir bloque `ssl` al pool.

**Archivo a modificar**: el módulo que crea el pool de `mysql2/promise`. Localízalo buscando `createPool` en `backend/src/`. Típicamente está en uno de estos paths:

- `backend/src/db.ts`
- `backend/src/config/database.ts`
- `backend/src/infrastructure/database.ts`

**Cambio**: añade `ssl` al objeto de configuración del pool. Adapta los nombres de variables a las que ya use el archivo, pero la estructura es:

```typescript
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_LIMIT) || 5,
  queueLimit: 0,
  // Activar TLS solo en producción (TiDB lo exige; MySQL local no lo necesita)
  ssl: process.env.DB_SSL === 'true' 
    ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } 
    : undefined,
});

export default pool;
```

**Por qué `DB_SSL` como flag**: permite que el código siga funcionando en local contra MySQL/XAMPP sin TLS, y solo activa SSL cuando la variable está a `true` (lo pondremos `true` en Render).

**Por qué `connectionLimit` bajo**: TiDB Starter tiene cuota de conexiones simultáneas. 5 es seguro para 1-2 usuarios.

### 1.2 CORS configurable por entorno

Localiza la configuración de CORS en el backend (busca `cors(` en `backend/src/`, típicamente en `backend/src/index.ts` o `backend/src/app.ts`).

Actualmente probablemente está hardcodeado a `http://localhost:5173`. Cámbialo para que lea de variable de entorno:

```typescript
import cors from 'cors';

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (curl, healthchecks de Render)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} no permitido por CORS`));
  },
  credentials: true,
}));
```

### 1.3 Puerto dinámico para Render

Render inyecta `PORT` como variable de entorno y espera que el servidor escuche en ese puerto. Verifica que el código ya hace esto (probablemente sí porque ya usa `process.env.PORT`). Si no:

```typescript
const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Importante**: el host debe ser `'0.0.0.0'`, no `'localhost'` ni `'127.0.0.1'`. Si está omitido en `app.listen(PORT, callback)`, Express usa `0.0.0.0` por defecto, así que está bien.

### 1.4 Firebase Admin SDK: manejo de `FIREBASE_PRIVATE_KEY` con saltos de línea

La private key de Firebase tiene `\n` literales cuando se guarda en una variable de entorno. Localiza el código que inicializa `firebase-admin` (busca `initializeApp` o `cert(` en `backend/src/`).

Asegúrate de que se hace el replace:

```typescript
import { initializeApp, cert } from 'firebase-admin/app';

// Solo inicializar Firebase si las 3 variables están presentes (modo PROD).
// Si faltan, queda en modo DEV con user id=1 (comportamiento ya existente).
const hasFirebaseConfig = 
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY;

if (hasFirebaseConfig) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Reemplazar \n literales por saltos de línea reales
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
  });
}
```

Si ya está implementado así, no hay que tocar nada.

### 1.5 Endpoint `/health` (verificación, probablemente ya existe)

El usuario menciona que `GET /health` ya devuelve `{"status":"ok","database":"connected"}`. Verifica que existe y que **no requiere autenticación** (Render lo va a llamar sin token). Si está bajo `/api/v1/health` con auth, duplícalo en `/health` sin auth, o expón uno nuevo en `/healthz` sin auth:

```typescript
// ANTES de los middlewares de auth
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});
```

### 1.6 Trust proxy (importante para Render)

Render pone tu app detrás de un proxy. Si usas rate limiting, logging de IP, o cookies seguras, necesitas:

```typescript
app.set('trust proxy', 1);  // confiar en el primer proxy
```

Añadir esto en `app.ts` / `index.ts` justo después de crear `app`.

### 1.7 Actualizar `backend/.env.example`

Añade las variables nuevas:

```bash
# Servidor
PORT=3001
NODE_ENV=development

# Base de datos
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=tfg_rutinas
DB_USER=root
DB_PASSWORD=
DB_SSL=false           # ← NUEVO: poner 'true' en producción (TiDB exige TLS)
DB_POOL_LIMIT=10       # ← NUEVO: bajar a 5 en producción

# CORS
ALLOWED_ORIGINS=http://localhost:5173   # ← NUEVO: lista separada por comas

# Firebase (vacías = modo DEV con user id=1)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

### 1.8 Verificar `package.json` scripts del backend

Asegúrate de que `backend/package.json` tiene:

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

Si falta `start` o `engines`, añádelos. Render usa `npm start` por defecto y lee `engines.node` para elegir la versión de Node.

### 1.9 Verificación post-Fase 1

```bash
cd backend
pnpm build
pnpm test
```

Tests deben seguir pasando (99/99 si no se rompió ningún test del backend). Build debe generar `dist/index.js` sin errores.

**Smoke test opcional contra MySQL local** (para confirmar que nada se rompió):

```bash
pnpm dev
# en otra terminal:
curl http://localhost:3001/health
# esperado: {"status":"ok","database":"connected"}
```

---

## Fase 2 — Frontend: cambios para producción

### 2.1 Variable de API URL (probablemente ya existe)

El usuario menciona que el frontend usa `VITE_API_URL`. Verifica en `frontend/src/` que toda llamada Axios usa esta variable, no URLs hardcodeadas a `localhost:3001`. Busca:

```bash
grep -rn "localhost:3001" frontend/src/
grep -rn "127.0.0.1:3001" frontend/src/
```

Si aparece algo hardcodeado, refactorízalo para usar `import.meta.env.VITE_API_URL`.

### 2.2 Warmup ping para mitigar cold start de Render

Este es el truco UX más importante para tu caso (uso en el gym). En cuanto carga el frontend, dispara un fetch al `/health` del backend **antes** del flujo de login, para que Render despierte en paralelo a la autenticación Firebase.

**Archivo a modificar**: `frontend/src/main.tsx` (o el entry point que sea).

Añade al inicio, justo después de los imports:

```typescript
// Warmup del backend en Render para evitar cold start visible al usuario.
// Disparamos un fetch sin await al /health para que el backend despierte
// mientras Firebase autentica al usuario.
const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
if (apiUrl) {
  const healthUrl = apiUrl.replace(/\/api\/v1\/?$/, '') + '/health';
  fetch(healthUrl, { method: 'GET', mode: 'cors' }).catch(() => {
    /* silencioso: si falla, da igual, la app sigue */
  });
}
```

### 2.3 UI de "despertando servidor" (opcional pero recomendado)

Si el primer request autenticado tarda más de 5s, muestra un mensaje informativo en lugar de un spinner mudo. En el interceptor Axios donde se inyecta el token Firebase, añade un timer:

```typescript
// Ejemplo en el interceptor de request de Axios
let slowRequestTimer: ReturnType<typeof setTimeout> | null = null;

axiosClient.interceptors.request.use(async (config) => {
  // ... inyección del token Firebase existente ...
  
  // Si la primera request tarda >5s, asumimos cold start de Render
  slowRequestTimer = setTimeout(() => {
    // Disparar evento o actualizar store de Zustand para mostrar
    // "Despertando servidor, esto tarda unos segundos solo la primera vez..."
    useUiStore.getState().setBackendWarmingUp(true);
  }, 5000);
  
  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    if (slowRequestTimer) clearTimeout(slowRequestTimer);
    useUiStore.getState().setBackendWarmingUp(false);
    return response;
  },
  (error) => {
    if (slowRequestTimer) clearTimeout(slowRequestTimer);
    useUiStore.getState().setBackendWarmingUp(false);
    return Promise.reject(error);
  },
);
```

Adapta los nombres de stores Zustand al patrón que ya use el proyecto.

### 2.4 Aumentar timeout de Axios

Por defecto Axios no tiene timeout. Para el cold start de Render necesitas al menos 60s:

```typescript
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 65000,  // 65s, suficiente para el peor cold start de Render
});
```

### 2.5 Actualizar `frontend/.env.example`

```bash
# URL del backend en producción (Render). En dev apuntar a localhost.
VITE_API_URL=http://localhost:3001/api/v1

# Firebase Web SDK
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
```

### 2.6 Verificación post-Fase 2

```bash
cd frontend
pnpm build
pnpm test
```

Tests deben seguir pasando. Build debe generar `dist/` sin errores y con tamaño similar al baseline (~1.2 MB).

---

## Fase 3 — PWA (instalable como app en el móvil)

Esto convierte la web en una "app web progresiva": en el móvil aparece "Añadir a pantalla de inicio", se abre en fullscreen sin barras de Chrome, splash screen, parece app nativa.

### 3.1 Instalar dependencia

```bash
cd frontend
pnpm add -D vite-plugin-pwa
```

### 3.2 Configurar el plugin en `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Mis Rutinas',           // Adaptar al nombre real del TFG
        short_name: 'Rutinas',
        description: 'Gestor de rutinas de entrenamiento',
        theme_color: '#0f172a',         // Adaptar al color principal del diseño
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // No cachear las llamadas a la API (que son a otro dominio)
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
});
```

### 3.3 Iconos PWA

Necesitas `public/pwa-192x192.png` y `public/pwa-512x512.png`. Si el proyecto ya tiene un logo, redimensiónalo. Si no, crea uno provisional con texto.

**Solución rápida si no hay diseño**: usa el servicio `https://realfavicongenerator.net` o `pwa-asset-generator` (CLI):

```bash
pnpm add -D pwa-asset-generator
npx pwa-asset-generator ./src/assets/logo.png ./public --opaque false --icon-only --favicon
```

Si no hay logo todavía, deja iconos placeholder (Claude Code puede generar un PNG simple con ImageMagick si está disponible, o el usuario los crea aparte).

### 3.4 Registrar el service worker

`vite-plugin-pwa` con `registerType: 'autoUpdate'` lo hace automáticamente. No requiere código adicional, pero si el proyecto quiere notificar al usuario de actualizaciones:

```typescript
// frontend/src/pwa.ts
import { registerSW } from 'virtual:pwa-register';

export const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Hay una nueva versión disponible. ¿Recargar?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App lista para funcionar offline');
  },
});
```

Importar este archivo desde `main.tsx`.

### 3.5 Tipos para Vite PWA

En `frontend/src/vite-env.d.ts` añade:

```typescript
/// <reference types="vite-plugin-pwa/client" />
```

### 3.6 Verificación post-Fase 3

```bash
cd frontend
pnpm build
ls dist/
# debe haber: sw.js, workbox-*.js, manifest.webmanifest, pwa-192x192.png, pwa-512x512.png
```

---

## Fase 4 — Archivos nuevos de despliegue

### 4.1 Crear `render.yaml` en la raíz del repo

Esto es opcional pero recomendado: permite que Render lea la config del repo en vez de configurarla a mano en el dashboard.

```yaml
services:
  - type: web
    name: tfg-rutinas-backend
    runtime: node
    rootDir: backend
    plan: free
    region: oregon       # o 'frankfurt' si TiDB cluster está en EU
    branch: main         # rama del repo copia (tfg-rutinas-deploy)
    buildCommand: pnpm install && pnpm build
    startCommand: pnpm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DB_SSL
        value: "true"
      - key: DB_POOL_LIMIT
        value: "5"
      # Las siguientes se configuran a mano en el dashboard (son secrets):
      # DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
      # FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
      # ALLOWED_ORIGINS
```

### 4.2 Crear `vercel.json` en `frontend/` (opcional)

Vercel auto-detecta Vite, pero podemos forzar:

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "pnpm install",
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

El `rewrites` es importante: hace que SPA con React Router funcione en URLs como `/rutinas/123` sin que devuelva 404.

### 4.3 Crear `DEPLOY.md` en la raíz

Documento separado, dirigido al humano, con los pasos manuales que él tiene que hacer (crear cuentas, configurar variables). Contenido:

```markdown
# Guía de despliegue manual

## 1. TiDB Cloud (base de datos)

1. Ir a https://tidbcloud.com y registrarse (login con GitHub, sin tarjeta).
2. Crear un cluster "Starter" (free):
   - Provider: AWS
   - Region: **us-east-1 (N. Virginia)** (mejor latencia con Render Oregon/Virginia free tier)
   - Nombre: `tfg-rutinas`
3. Una vez creado, hacer clic en "Connect":
   - Connection type: Public
   - Method: General
   - Crear password (guárdalo en gestor de contraseñas)
   - Anotar: `Host`, `Port` (4000), `User` (formato `XXXXXX.root`), `Database` name (default)
4. Importar esquema y datos:
   - Exportar desde MySQL local:
     ```bash
     mysqldump -u root -p tfg_rutinas > tfg_dump.sql
     ```
   - En el dashboard de TiDB, ir a "Import" → "From local" → subir `tfg_dump.sql`
   - Alternativa CLI:
     ```bash
     mysql -h <HOST> -P 4000 -u <USER> -p \
       --ssl-mode=VERIFY_IDENTITY --ssl-ca=/etc/ssl/certs/ca-certificates.crt \
       <DATABASE> < tfg_dump.sql
     ```
5. Verificar:
   ```bash
   mysql -h <HOST> -P 4000 -u <USER> -p --ssl-mode=VERIFY_IDENTITY \
     -e "USE tfg_rutinas; SHOW TABLES; SELECT COUNT(*) FROM exercises;"
   ```

## 2. Render (backend)

1. Ir a https://render.com y registrarse (login con GitHub, sin tarjeta).
2. New → Web Service → conectar el repo **`tfg-rutinas-deploy`** (NO el original del TFG).
3. Configuración:
   - **Name**: `tfg-rutinas-backend`
   - **Region**: Oregon o Virginia (la más cercana al cluster TiDB)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start`
   - **Plan**: Free
4. En la sección "Environment Variables", añadir todas:
   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DB_HOST` | _(de TiDB)_ |
   | `DB_PORT` | `4000` |
   | `DB_USER` | _(de TiDB, formato `XXXXXX.root`)_ |
   | `DB_PASSWORD` | _(de TiDB)_ |
   | `DB_NAME` | _(de TiDB, default `test` salvo que hayas creado otra)_ |
   | `DB_SSL` | `true` |
   | `DB_POOL_LIMIT` | `5` |
   | `ALLOWED_ORIGINS` | _(provisionalmente vacío; se rellena tras desplegar Vercel)_ |
   | `FIREBASE_PROJECT_ID` | _(de Firebase service account JSON)_ |
   | `FIREBASE_CLIENT_EMAIL` | _(de Firebase service account JSON)_ |
   | `FIREBASE_PRIVATE_KEY` | _(de Firebase service account JSON, pegar incluyendo los `\n` literales)_ |
5. Health Check Path: `/health`
6. Click "Create Web Service". Espera a que el build termine (~3-5 min la primera vez).
7. Anotar la URL pública: `https://tfg-rutinas-backend.onrender.com`.

### Obtener credenciales Firebase Admin

Ir a https://console.firebase.google.com → tu proyecto → ⚙️ Project settings → Service accounts → Generate new private key. Descarga un JSON. De ese JSON saca:
- `project_id` → `FIREBASE_PROJECT_ID`
- `client_email` → `FIREBASE_CLIENT_EMAIL`
- `private_key` → `FIREBASE_PRIVATE_KEY` (pegar tal cual, con los `\n` dentro de las comillas)

## 3. Vercel (frontend)

1. Ir a https://vercel.com y registrarse (login con GitHub, sin tarjeta).
2. New Project → importar el repo **`tfg-rutinas-deploy`** de GitHub (NO el original del TFG).
3. Configuración:
   - **Project Name**: `tfg-rutinas`
   - **Framework Preset**: Vite (auto-detecta)
   - **Root Directory**: `frontend`
   - **Branch**: `main`
4. Environment Variables:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://tfg-rutinas-backend.onrender.com/api/v1` |
   | `VITE_FIREBASE_API_KEY` | _(de Firebase Web SDK config)_ |
   | `VITE_FIREBASE_AUTH_DOMAIN` | _(de Firebase Web SDK config)_ |
   | `VITE_FIREBASE_PROJECT_ID` | _(mismo que el backend)_ |
5. Click "Deploy". Espera ~2-3 min.
6. Anotar la URL: `https://tfg-rutinas.vercel.app`.

### Obtener credenciales Firebase Web SDK

Firebase Console → tu proyecto → ⚙️ Project settings → General → Your apps → click la web app → Config. Copia los valores ahí.

## 4. Cerrar el círculo: actualizar CORS en Render

Vuelve a Render → tu service → Environment → edita `ALLOWED_ORIGINS`:

```
https://tfg-rutinas.vercel.app
```

(Si vas a usar dominio custom, añádelo también: `https://tfg-rutinas.vercel.app,https://rutinas.tudominio.com`)

Render redesplegará automáticamente el backend (1 min).

## 5. Configurar Firebase Auth para los dominios nuevos

Firebase Console → Authentication → Settings → Authorized domains. Añadir:
- `tfg-rutinas.vercel.app`
- (cualquier dominio custom que vayas a usar)

Sin esto, el login con Google y email/password fallará desde Vercel.

## 6. Smoke test final

Desde el móvil, abre `https://tfg-rutinas.vercel.app`:
1. Debe cargar el frontend instantáneo.
2. Login con Google o email → debería completarse (el warmup ping ya despertó el backend).
3. Ver rutinas, ejercicios, crear sesión, registrar set, etc.
4. En móvil: menú del navegador → "Añadir a pantalla de inicio". El icono PWA aparece en el escritorio.

## Troubleshooting

- **`CORS error`**: revisa `ALLOWED_ORIGINS` en Render, sin barra final (`/`), exactamente igual que la URL de Vercel.
- **`Database connection failed`**: probablemente falta `DB_SSL=true` o el puerto está mal (debe ser 4000, no 3306).
- **Backend tarda 60s al primer request**: es el cold start de Render free. Normal. El warmup ping del frontend lo mitiga.
- **`FIREBASE_PRIVATE_KEY` no funciona**: el replace `\\n` → `\n` no está aplicado, o copiaste mal la key (debe incluir `-----BEGIN PRIVATE KEY-----` ... `-----END PRIVATE KEY-----`).
- **Build de Render falla con `pnpm not found`**: añadir `"packageManager": "pnpm@9.x.x"` al `package.json` del backend, o cambiar buildCommand a `npm install && npm run build`.
```

### 4.4 Actualizar `.gitignore` de la raíz

Asegúrate de que estos patrones están en `.gitignore`:

```gitignore
# Entornos
.env
.env.local
.env.production
*.env.local

# Builds
backend/dist/
frontend/dist/

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# Sistema
.DS_Store
Thumbs.db

# IDEs
.vscode/
.idea/

# Node
node_modules/
```

### 4.5 Crear `backend/.env.production.example`

```bash
# Para Render — copiar valores reales al dashboard de Render, NUNCA commitear con valores reales
NODE_ENV=production
PORT=                    # Render lo inyecta, dejar vacío
DB_HOST=gateway01.us-east-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_NAME=test
DB_USER=XXXXXX.root
DB_PASSWORD=xxxxxxxx
DB_SSL=true
DB_POOL_LIMIT=5
ALLOWED_ORIGINS=https://tfg-rutinas.vercel.app
FIREBASE_PROJECT_ID=tu-proyecto
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvg...\n-----END PRIVATE KEY-----\n"
```

### 4.6 Crear `frontend/.env.production.example`

```bash
VITE_API_URL=https://tfg-rutinas-backend.onrender.com/api/v1
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
```

---

## Fase 5 — Verificación final antes de commit

### 5.1 Build completo de todo

```bash
# Backend
cd backend
pnpm install
pnpm build
pnpm test

# Frontend
cd ../frontend
pnpm install
pnpm build
pnpm test
```

**Todo debe pasar sin warnings nuevos.**

### 5.2 Diff review

```bash
cd ..
git status
git diff --stat
```

Revisa cada archivo modificado. Cambios esperados:

- `backend/src/<archivo-db>.ts` — añadido bloque `ssl` al pool
- `backend/src/<archivo-app>.ts` — CORS por env var, `trust proxy`
- `backend/src/<archivo-firebase>.ts` — replace de `\n` (si no estaba)
- `backend/.env.example` — variables nuevas
- `backend/package.json` — script `start` y `engines.node` (si faltaban)
- `frontend/src/main.tsx` — warmup ping
- `frontend/src/<axios-config>.ts` — timeout 65s, timer cold start
- `frontend/vite.config.ts` — plugin PWA
- `frontend/package.json` — dep `vite-plugin-pwa`
- `frontend/public/pwa-*.png` — iconos PWA (si los creaste)
- `frontend/src/vite-env.d.ts` — referencia tipos PWA
- `frontend/.env.example` — sin cambios o cambios menores
- Raíz: `render.yaml` (nuevo), `DEPLOY.md` (nuevo), `.gitignore` (si necesitaba updates)

### 5.3 Commit por fases (recomendado)

```bash
git add backend/
git commit -m "feat(backend): adapt config for Render + TiDB Cloud deployment"

git add frontend/
git commit -m "feat(frontend): warmup ping, PWA setup, prod-ready axios config"

git add render.yaml vercel.json DEPLOY.md .gitignore
git commit -m "chore: add deployment manifests and documentation"
```

### 5.4 Push de la rama `main` al repo copia

```bash
git push origin main
```

**RECUERDA**: estás en `~/proyectos/tfg-rutinas-deploy/`. El `git push` va al repo NUEVO de GitHub (`tfg-rutinas-deploy`), no al original. Verifica con `git remote -v` antes de push si tienes la mínima duda.

El repo original del TFG queda exactamente igual que el día del entregue. No tiene ramas nuevas, ni commits nuevos, ni nada cambiado. Solo el tag `tfg-entrega-v1.0` apuntando al commit del entregue (si hiciste el paso 0.2).

---

## Resumen para el usuario humano cuando termines

Al finalizar, comunica al usuario:

> ✅ He preparado todo el código para desplegar en Vercel + Render + TiDB Cloud.
>
> **Repositorios:**
> - **TFG original** (`~/proyectos/tfg-original/`, repo `<URL-original>`): **intocado**, tal cual lo entregaste. Solo tiene un tag nuevo `tfg-entrega-v1.0` marcando el commit del entregue (no es un cambio de código).
> - **Copia para despliegue** (`~/proyectos/tfg-rutinas-deploy/`, repo `<URL-nuevo>`): contiene todos los cambios de despliegue, listo para conectar a Render y Vercel.
>
> Para completar el despliegue, abre `DEPLOY.md` (dentro del repo copia) y sigue los pasos manuales: crear cuentas en TiDB, Render y Vercel, configurar variables de entorno. Tiempo estimado: 1-2h.
>
> **Resumen de cambios en el repo copia:**
> - Backend: configuración SSL para TiDB, CORS por env var, trust proxy, script `start`.
> - Frontend: warmup ping anti-cold-start, timeout Axios 65s, PWA instalable.
> - Nuevos: `render.yaml`, `vercel.json`, `DEPLOY.md`, `.env.production.example` en ambos sub-proyectos.
>
> Tests: 99/99 pasando. Builds OK. Diff total: X líneas en Y archivos.
>
> El repo original del TFG queda intocable para siempre, como debe ser para un trabajo académico ya entregado.

---

## Apéndice A — Tabla completa de variables de entorno

### Backend (Render)

| Variable | Valor en local | Valor en Render | Notas |
|---|---|---|---|
| `PORT` | `3001` | (auto-inyectado) | No definir manualmente en Render |
| `NODE_ENV` | `development` | `production` | |
| `DB_HOST` | `127.0.0.1` | `gateway01.us-east-1.prod.aws.tidbcloud.com` | De TiDB Connect |
| `DB_PORT` | `3306` | `4000` | TiDB usa 4000 |
| `DB_NAME` | `tfg_rutinas` | `test` (o tu db name) | |
| `DB_USER` | `root` | `XXXXXX.root` | Prefijo obligatorio en TiDB |
| `DB_PASSWORD` | _(tu pwd local)_ | _(generado al crear TiDB)_ | |
| `DB_SSL` | `false` | `true` | TiDB exige TLS |
| `DB_POOL_LIMIT` | `10` | `5` | TiDB Starter tiene límite |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | `https://tfg-rutinas.vercel.app` | Lista CSV |
| `FIREBASE_PROJECT_ID` | _(vacío para modo DEV)_ | _(de service account)_ | |
| `FIREBASE_CLIENT_EMAIL` | _(vacío para modo DEV)_ | _(de service account)_ | |
| `FIREBASE_PRIVATE_KEY` | _(vacío para modo DEV)_ | _(de service account, con `\n`)_ | |

### Frontend (Vercel)

| Variable | Valor en local | Valor en Vercel |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3001/api/v1` | `https://tfg-rutinas-backend.onrender.com/api/v1` |
| `VITE_FIREBASE_API_KEY` | _(de Firebase Web)_ | _(mismo)_ |
| `VITE_FIREBASE_AUTH_DOMAIN` | `tu-proyecto.firebaseapp.com` | _(mismo)_ |
| `VITE_FIREBASE_PROJECT_ID` | `tu-proyecto` | _(mismo)_ |

---

## Apéndice B — Decisiones técnicas justificadas (por si el usuario pregunta)

- **¿Por qué TiDB y no PlanetScale/Aiven/Railway?** PlanetScale eliminó su free tier en abril 2024. Aiven solo tiene trial de 1 mes. Railway pasó a modelo de crédito ($5 trial, no "siempre gratis"). TiDB Cloud Starter es la única opción MySQL-compatible con free tier sin tarjeta, sin expiración, y 5 GiB de storage (más que suficiente).
- **¿Por qué no migrar a Postgres + Neon?** Sería técnicamente mejor (Neon: 3GB free, mejor ecosistema), pero el backend usa `mysql2/promise` con queries SQL crudas (no hay ORM). Migrar implicaría reescribir todas las queries (`?` → `$1`, funciones MySQL → Postgres, tipos, etc.). Para el alcance de este TFG, no compensa.
- **¿Por qué Render y no Fly.io?** Fly.io ya no tiene free tier real (usage-based con tarjeta obligatoria). Render mantiene free web service genuino sin tarjeta. El precio: cold start de 30-60s tras 15 min de inactividad, que el usuario acepta y mitigamos con warmup ping.
- **¿Por qué Vercel y no Cloudflare Pages/Netlify?** Cualquiera de las tres vale. Vercel tiene la mejor experiencia con Vite+React por defecto y free tier muy generoso (100 GB bandwidth/mes). Migrar a Cloudflare Pages después es trivial.
- **¿Por qué `connectionLimit: 5`?** TiDB Starter tiene cuota de conexiones simultáneas en el free tier. Como Render free corre 1 instancia única (no multi-region), 5 conexiones es de sobra para el tráfico esperado (1-2 usuarios).
- **¿Por qué `trust proxy`?** Render y Vercel ponen proxies delante. Sin `trust proxy`, Express ve siempre la IP del proxy en `req.ip`, lo cual rompe rate limiting basado en IP y devuelve URLs incorrectas en redirects.

---

**Fin del plan.**
