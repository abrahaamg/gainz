import { create } from 'zustand'
import { User as FirebaseUser } from 'firebase/auth'

export interface MysqlUser {
  id: number
  email: string
  username: string
  sex: string | null
  age: number | null
  birth_date: string | null
  fitness_level: string | null
  experience: string | null
  weight_kg: number | null
  height_cm: number | null
  goals: string[] | null
  primary_goal: string | null
  available_days: string[] | null
  session_duration_min: number | null
  injuries: string[] | null
  onboarding_done: boolean
  avatar_url: string | null
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
