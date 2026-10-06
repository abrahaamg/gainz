import { Request, Response, NextFunction } from 'express'
import type { DecodedIdToken } from 'firebase-admin/auth'
import { verifyIdToken } from '../services/firebaseService'
import { AppError, UnauthorizedError } from '../utils/customErrors'
import {
  createFirebaseUser,
  findUserByFirebaseUid,
  isUsernameTaken,
  updateUserEmail,
} from '../queries/user.queries'

/**
 * Atajo de desarrollo: sin Firebase configurado se trabaja con un usuario fijo
 * para poder probar la API en local sin montar autenticación real.
 *
 * Solo se activa fuera de producción. En producción, la ausencia de
 * credenciales NO puede dejar pasar peticiones: se rechaza la petición. Antes
 * bastaba con que faltara FIREBASE_PROJECT_ID en el despliegue para que toda la
 * API quedara abierta como usuario 1 sin ningún aviso.
 */
const isProduction = process.env.NODE_ENV === 'production'
const firebaseConfigured = Boolean(process.env.FIREBASE_PROJECT_ID)
const devAuthBypass = !isProduction && !firebaseConfigured
const USERNAME_MAX = 100

/**
 * Solo con NODE_ENV=test (tests de integración): la cabecera x-test-user-id
 * elige el usuario de la petición sin pasar por Firebase, para poder probar
 * qué puede tocar cada usuario. Con cualquier otro NODE_ENV se ignora.
 */
const testAuth = process.env.NODE_ENV === 'test'
const TEST_USER_HEADER = 'x-test-user-id'

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  if (testAuth) {
    const testUserId = Number(req.headers[TEST_USER_HEADER])
    if (Number.isInteger(testUserId) && testUserId > 0) {
      req.user = { id: testUserId, email: null }
      return next()
    }
  }

  if (devAuthBypass) {
    req.user = { id: 1, email: 'dev@test.com' }
    return next()
  }

  if (!firebaseConfigured) {
    console.error(
      '[auth] FIREBASE_PROJECT_ID no está definido en producción: se rechazan todas las peticiones.'
    )
    next(new AppError('Autenticación no configurada en el servidor', 500))
    return
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    next(new UnauthorizedError('Token no proporcionado'))
    return
  }

  let decoded: DecodedIdToken
  try {
    decoded = await verifyIdToken(authHeader.split(' ')[1])
  } catch {
    next(new UnauthorizedError('Token inválido o expirado'))
    return
  }

  // Un fallo de BD aquí no es un problema del token: va al ErrorHandler (500)
  try {
    req.user = await syncFirebaseUser(decoded)
  } catch (err) {
    next(err)
    return
  }
  next()
}

/**
 * Crea o actualiza en MySQL el usuario de Firebase y devuelve su id.
 *
 * username y email son UNIQUE: si el username derivado del email ya existe
 * (juan@gmail vs juan@hotmail) se le añade un sufijo sacado del uid, y si
 * Firebase no da email se guarda NULL en vez de '' (que chocaba entre cuentas).
 */
const syncFirebaseUser = async (
  decoded: DecodedIdToken
): Promise<{ id: number; email: string | null }> => {
  const email = decoded.email || null

  const existing = await findUserByFirebaseUid(decoded.uid)
  if (existing) {
    if (email && existing.email !== email) {
      await updateUserEmail(existing.id, email)
    }
    return { id: existing.id, email: email ?? existing.email }
  }

  const base = (email?.split('@')[0] || decoded.uid).slice(0, USERNAME_MAX)
  const suffix = decoded.uid.slice(0, 10)
  const username = (await isUsernameTaken(base))
    ? `${base.slice(0, USERNAME_MAX - suffix.length - 1)}_${suffix}`
    : base

  try {
    const userId = await createFirebaseUser(decoded.uid, email, username)
    return { id: userId, email }
  } catch (err) {
    // Dos peticiones simultáneas del mismo usuario nuevo: la otra ya lo creó
    const raced = (err as { code?: string }).code === 'ER_DUP_ENTRY'
      ? await findUserByFirebaseUid(decoded.uid)
      : undefined
    if (!raced) throw err
    return raced
  }
}
