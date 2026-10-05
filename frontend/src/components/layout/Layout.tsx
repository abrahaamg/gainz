import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import AccessibilityPanel from '../accessibility/AccessibilityPanel'
import RouteSuspense from '../ui/RouteSuspense'

export default function Layout() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      {/* Ancho único de página; pb-20 en móvil deja sitio al tab bar inferior */}
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-10 pb-20 md:pb-10">
        <RouteSuspense>
          <Outlet />
        </RouteSuspense>
      </main>
      <AccessibilityPanel />
    </div>
  )
}
