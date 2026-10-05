import { useCallback, useEffect } from 'react'
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth'
import { auth } from '../config/firebase'
import { DEV_MODE, FIREBASE_CONFIGURED } from '../config/authMode'
import { useAuthStore } from '../store/useAuthStore'
import { clearAllTrainingFlags } from '../utils/trainingFlag'
import { authService } from '../services/authService'

// Inicializa el listener de Firebase y sincroniza con backend
export function useAuthInit() {
  const retryToken = useAuthStore(s => s.retryToken)

  useEffect(() => {
    const { setFirebaseUser, setMysqlUser, setLoading, setAuthError, clear } = useAuthStore.getState()
    let cancelled = false

    // Carga el perfil de MySQL. Si falla, no cierra sesión: deja authError para poder reintentar.
    const loadProfile = async () => {
      setAuthError(false)
      try {
        const profile = await authService.getProfile()
        if (!cancelled) setMysqlUser(profile)
      } catch {
        if (!cancelled) {
          setMysqlUser(null)
          setAuthError(true)
        }
      }
    }

    if (DEV_MODE) {
      // En DEV cargamos el usuario de MySQL directamente (id=1 en backend)
      loadProfile().finally(() => { if (!cancelled) setLoading(false) })
      return () => { cancelled = true }
    }

    if (!FIREBASE_CONFIGURED) {
      // Producción sin Firebase: nunca se abre la app (App muestra el error de configuración)
      clear()
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      if (cancelled) return
      if (firebaseUser) {
        setLoading(true)
        setFirebaseUser(firebaseUser)
        await loadProfile()
      } else {
        clear()
      }
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [retryToken])
}


// Cierra sesión: Firebase (si hay), estado local y marcas de localStorage del usuario.
export function useLogout() {
  const clear = useAuthStore(s => s.clear)
  return useCallback(async () => {
    try {
      if (auth.currentUser) await fbSignOut(auth)
    } catch { /* sin Firebase (DEV) o ya cerrada */ }
    clearAllTrainingFlags()
    clear()
  }, [clear])
}
