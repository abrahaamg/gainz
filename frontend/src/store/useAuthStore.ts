import { create } from 'zustand'
import { User as FirebaseUser } from 'firebase/auth'

interface MysqlUser {
  id: number
  email: string
  username: string
  fitness_level: string | null
  weight_kg: number | null
}

interface AuthState {
  firebaseUser: FirebaseUser | null
  mysqlUser:    MysqlUser | null
  loading:      boolean
  setFirebaseUser: (user: FirebaseUser | null) => void
  setMysqlUser:    (user: MysqlUser | null)    => void
  setLoading:      (v: boolean)                => void
  clear:           ()                          => void
}

export const useAuthStore = create<AuthState>(set => ({
  firebaseUser: null,
  mysqlUser:    null,
  loading:      true,

  setFirebaseUser: user    => set({ firebaseUser: user }),
  setMysqlUser:    user    => set({ mysqlUser: user }),
  setLoading:      loading => set({ loading }),
  clear: () => set({ firebaseUser: null, mysqlUser: null, loading: false }),
}))
