import express, { Application } from 'express'
import cors from 'cors'
import router from './router'
import { notFound } from './middlewares'
import { ErrorHandler } from './utils'

const app: Application = express()

// ─── Middlewares globales ─────────────────────────────────────
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── Rutas ───────────────────────────────────────────────────
app.use(router)

// ─── 404 ─────────────────────────────────────────────────────
app.use(notFound)

// ─── Error handler global ────────────────────────────────────
app.use(ErrorHandler)

export default app
