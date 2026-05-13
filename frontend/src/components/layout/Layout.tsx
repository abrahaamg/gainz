import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import AccessibilityPanel from '../accessibility/AccessibilityPanel'

export default function Layout() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <AccessibilityPanel />
    </div>
  )
}
