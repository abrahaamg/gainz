import express, { Application } from 'express'
import cors from 'cors'
import router from './router'
import { notFound } from './middlewares'
import { ErrorHandler } from './utils'

const app: Application = express()

// ─── Middlewares globales ─────────────────────────────────────
// CORS_ORIGINS es una lista separada por comas con los orígenes permitidos.
// Si no se define (desarrollo local) se acepta cualquier origen, que es el
// comportamiento anterior; en un despliegue real conviene fijarla.
const corsOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors(corsOrigins.length > 0 ? { origin: corsOrigins } : undefined))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// ─── Rutas ───────────────────────────────────────────────────
app.use(router)

// ─── 404 ─────────────────────────────────────────────────────
app.use(notFound)

// ─── Error handler global ────────────────────────────────────
app.use(ErrorHandler)

export default app
