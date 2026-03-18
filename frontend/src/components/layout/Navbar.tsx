import { NavLink, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../config/firebase'
import { useAuthStore } from '../../store/useAuthStore'

const NAV_ITEMS = [
  { to: '/',               label: '🏠 Inicio' },
  { to: '/exercises',      label: '💪 Ejercicios' },
  { to: '/routines',       label: '📋 Rutinas' },
  { to: '/progress',       label: '📈 Progreso' },
  { to: '/equipment',      label: '🏋️ Equipamiento' },
]

export default function Navbar() {
  const navigate   = useNavigate()
  const { clear }  = useAuthStore()

  const handleLogout = async () => {
    await signOut(auth)
    clear()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <span className="font-bold text-lg text-blue-600">Gainz 💪</span>
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="ml-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            Salir
          </button>
        </div>
      </div>
    </nav>
  )
}
