import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence, type Auth } from 'firebase/auth'
import { FIREBASE_CONFIGURED } from './authMode'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
}

let app: FirebaseApp | null = null
let auth: Auth

if (FIREBASE_CONFIGURED) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  // Persistir sesión en localStorage — sobrevive cierres de pestaña
  setPersistence(auth, browserLocalPersistence).catch(() => {})
} else {
  // Sin Firebase: solo válido en DEV_MODE (ver authMode.ts). En producción App muestra error de configuración.
  auth = {} as Auth
}

export { auth }
