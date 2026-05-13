import { useEffect } from 'react'
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth'
import { auth } from '../config/firebase'
import { useAuthStore } from '../store/useAuthStore'
import api from '../services/api'

const DEV_MODE = !import.meta.env.VITE_FIREBASE_PROJECT_ID

// Inicializa el listener de Firebase y sincroniza con backend
export function useAuthInit() {
  const { setLoading, clear } = useAuthStore()
  const { setFirebaseUser, setMysqlUser } = useAuthStore()

  useEffect(() => {
    if (DEV_MODE) {
      // En DEV cargamos el usuario de MySQL directamente (id=1 en backend)
      api.get('/auth/')
        .then(res => setMysqlUser(res.data.data))
        .catch(() => {})
        .finally(() => setLoading(false))
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      if (firebaseUser) {
        setFirebaseUser(firebaseUser)
        try {
          const res = await api.get('/auth/')
          setMysqlUser(res.data.data)
        } catch {
          await fbSignOut(auth)
          clear()
          return
        }
      } else {
        clear()
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])
}

export function useAuth() {
  return useAuthStore()
}
