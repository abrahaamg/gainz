import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/',               label: '🏠 Inicio' },
  { to: '/exercises',      label: '💪 Ejercicios' },
  { to: '/routines',       label: '📋 Rutinas' },
  { to: '/progress',       label: '📈 Progreso' },
  { to: '/equipment',      label: '🏋️ Equipamiento' },
]

export default function Navbar() {
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
        </div>
      </div>
    </nav>
  )
}
