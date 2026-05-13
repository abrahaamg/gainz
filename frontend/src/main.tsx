import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import App from './App.tsx'

// Apply accessibility preferences globally before React mounts.
// Si no se hace aquí, rutas fuera del Layout (/login, /register, /onboarding)
// se renderizarían con el tema por defecto (claro) en vez del guardado.
function applyA11yPrefs() {
  try {
    const load = <T,>(key: string, fallback: T): T => {
      const v = localStorage.getItem(`gainz_a11y_${key}`)
      return v ? (JSON.parse(v) as T) : fallback
    }
    const theme    = load<'claro' | 'oscuro'>('theme', 'claro')
    const contrast = load<'normal' | 'alto'>('contrast', 'normal')
    const reduced  = load<boolean>('reducedMotion', false)
    const fontSize = load<'normal' | 'grande' | 'muy-grande'>('fontSize', 'normal')

    document.documentElement.classList.toggle('dark', theme === 'oscuro')
    document.documentElement.classList.toggle('high-contrast', contrast === 'alto')
    document.documentElement.classList.toggle('reduce-motion', reduced)
    const scale = fontSize === 'muy-grande' ? '130%' : fontSize === 'grande' ? '115%' : '100%'
    document.documentElement.style.fontSize = scale
  } catch { /* localStorage no disponible — usar defaults */ }
}
applyA11yPrefs()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
