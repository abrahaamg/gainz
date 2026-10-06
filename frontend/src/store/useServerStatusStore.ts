import { create } from 'zustand'

interface ServerStatusState {
  /** true cuando una petición lleva demasiado tiempo (el backend gratuito se estaba despertando) */
  waking: boolean
  setWaking: (waking: boolean) => void
}

export const useServerStatusStore = create<ServerStatusState>(set => ({
  waking: false,
  setWaking: waking => set({ waking }),
}))
