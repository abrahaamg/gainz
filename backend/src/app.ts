import express, { Application } from 'express'
import cors, { CorsOptions } from 'cors'
import helmet from 'helmet'
import router from './router'
import { notFound } from './middlewares'
import { ErrorHandler } from './utils'

const app: Application = express()

const isProduction = process.env.NODE_ENV === 'production'

// En producción la app va detrás del proxy de Render: sin esto el rate limit
// vería la IP del proxy para todas las peticiones.
if (isProduction) app.set('trust proxy', 1)

// ─── Middlewares globales ─────────────────────────────────────
// CORS_ORIGINS es una lista separada por comas con los orígenes permitidos.
// En desarrollo, si no se define, se acepta cualquier origen. En producción,
// si falta, no se acepta ningún origen cruzado.
const corsOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

let corsOptions: CorsOptions | undefined
if (corsOrigins.length > 0) {
  corsOptions = { origin: corsOrigins }
} else if (isProduction) {
  console.error('[cors] CORS_ORIGINS no está definido en producción: se rechazan los orígenes cruzados.')
  corsOptions = { origin: false }
}

app.use(helmet())
app.use(cors(corsOptions))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// ─── Rutas ───────────────────────────────────────────────────
app.use(router)

// ─── 404 ─────────────────────────────────────────────────────
app.use(notFound)

// ─── Error handler global ────────────────────────────────────
app.use(ErrorHandler)

export default app
