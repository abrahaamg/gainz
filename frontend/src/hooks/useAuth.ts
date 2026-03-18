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
    // Sin Firebase configurado → modo DEV, no hay listener
    if (DEV_MODE) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      if (firebaseUser) {
        setFirebaseUser(firebaseUser)
        try {
          const res = await api.get('/auth')
          setMysqlUser(res.data.data)
        } catch {
          // token inválido — cerrar sesión
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
