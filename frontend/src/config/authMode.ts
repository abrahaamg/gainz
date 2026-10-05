// Única fuente de verdad sobre el modo de autenticación.
// DEV_MODE solo existe en desarrollo (vite dev) y sin Firebase configurado:
// un build de producción nunca abre la app sin login.
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined

export const FIREBASE_CONFIGURED = Boolean(projectId && apiKey)

export const DEV_MODE = import.meta.env.DEV && !FIREBASE_CONFIGURED

// En producción sin Firebase configurado la app no puede autenticar: se muestra un error de configuración.
export const AUTH_CONFIG_MISSING = !import.meta.env.DEV && !FIREBASE_CONFIGURED
