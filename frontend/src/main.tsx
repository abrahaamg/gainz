import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import App from './App.tsx'
import { applyStoredA11yPrefs } from './utils/a11yPrefs'

applyStoredA11yPrefs()

// Calentamiento del backend (Render gratuito se duerme): se despierta en paralelo al login.
const apiUrl = import.meta.env.VITE_API_URL as string | undefined
if (apiUrl) {
  const healthUrl = apiUrl.replace(/\/api\/v1\/?$/, '') + '/health'
  fetch(healthUrl, { method: 'GET', mode: 'cors' }).catch(() => {
    /* silencioso: si falla, la app sigue */
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
