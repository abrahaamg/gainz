import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence, type Auth } from 'firebase/auth'

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY

const firebaseConfig = {
  apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID,
}

let app: FirebaseApp | null = null
let auth: Auth

if (apiKey) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  // Persistir sesión en localStorage — sobrevive cierres de pestaña
  setPersistence(auth, browserLocalPersistence).catch(() => {})
} else {
  // DEV mode — Firebase not configured, use mock auth
  auth = {} as Auth
}

export { auth }
