import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { useTranslation } from 'react-i18next'
import { auth } from '../../config/firebase'
import { useAuthStore } from '../../store/useAuthStore'

const NAV_KEYS = [
  { to: '/exercises',      key: 'exercises' },
  { to: '/routines',       key: 'routines' },
  { to: '/progress',       key: 'progress' },
  { to: '/history',        key: 'history' },
  { to: '/equipment',      key: 'equipment' },
  { to: '/recommendations',key: 'recommendations' },
  { to: '/glossary',       key: 'glossary' },
] as const

export default function Navbar() {
  const { t } = useTranslation()
  const navigate  = useNavigate()
  const location  = useLocation()
  const { clear } = useAuthStore()
  const isHome = location.pathname === '/'

  const handleLogout = async () => {
    try {
      if (auth.currentUser) await signOut(auth)
    } catch { /* DEV mode — no Firebase */ }
    clear()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="bg-neutral-900 sticky top-0 z-50 border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-center h-12 gap-8">
        <NavLink to="/" className={`font-display italic tracking-tight text-xl transition-colors mr-auto ${isHome ? 'text-accent' : 'text-white hover:text-accent'}`}>
          Gainz
        </NavLink>

        <div className="flex items-center gap-1">
          {NAV_KEYS.map(({ to, key }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-3 py-1.5 text-[12px] font-medium tracking-wide transition-colors rounded-full ${
                  isActive
                    ? 'text-accent'
                    : 'text-neutral-400 hover:text-accent'
                }`
              }
            >
              {t(`nav.${key}`)}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `px-3 py-1.5 text-[12px] font-medium tracking-wide transition-colors rounded-full ${
                isActive ? 'text-accent' : 'text-neutral-400 hover:text-accent'
              }`
            }
          >
            {t('nav.profile')}
          </NavLink>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-[12px] font-medium tracking-wide text-neutral-500 hover:text-accent transition-colors"
          >
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </nav>
  )
}
