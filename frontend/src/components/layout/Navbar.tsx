import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLogout } from '../../hooks/useAuth'
import { cn } from '../../lib/utils'

// Enlaces de la barra superior (desde md)
const NAV_KEYS = [
  { to: '/exercises',      key: 'exercises' },
  { to: '/routines',       key: 'routines' },
  { to: '/progress',       key: 'progress' },
  { to: '/history',        key: 'history' },
  { to: '/equipment',      key: 'equipment' },
  { to: '/recommendations',key: 'recommendations' },
  { to: '/glossary',       key: 'glossary' },
] as const

// Tab bar inferior (móvil): destinos principales
const TAB_ITEMS = [
  { to: '/',         key: 'home',     icon: 'bi-house',       activeIcon: 'bi-house-fill',  end: true },
  { to: '/routines', key: 'routines', icon: 'bi-list-check',  activeIcon: null, end: false },
  { to: '/progress', key: 'progress', icon: 'bi-graph-up',    activeIcon: null, end: false },
  { to: '/profile',  key: 'profile',  icon: 'bi-person',      activeIcon: 'bi-person-fill', end: false },
] as const

// Destinos secundarios del menú "Más" (móvil)
const MORE_ITEMS = [
  { to: '/exercises',       key: 'exercises',       icon: 'bi-lightning-charge' },
  { to: '/history',         key: 'history',         icon: 'bi-clock-history' },
  { to: '/equipment',       key: 'equipment',       icon: 'bi-tools' },
  { to: '/recommendations', key: 'recommendations', icon: 'bi-stars' },
  { to: '/glossary',        key: 'glossary',        icon: 'bi-book' },
] as const

const desktopLink = ({ isActive }: { isActive: boolean }) =>
  cn(
    'px-3 py-1.5 text-xs font-medium tracking-wide transition-colors rounded-full',
    isActive ? 'text-accent' : 'text-neutral-400 hover:text-accent',
  )

export default function Navbar() {
  const { t } = useTranslation()
  const navigate  = useNavigate()
  const location  = useLocation()
  const logout = useLogout()
  const isHome = location.pathname === '/'
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLLIElement>(null)
  const moreButtonRef = useRef<HTMLButtonElement>(null)

  // En la sesión en vivo la barra de acción ocupa el sitio del tab bar
  const hideTabBar = /^\/session\/\d+$/.test(location.pathname)

  const moreActive = MORE_ITEMS.some(i => location.pathname.startsWith(i.to))

  // Cierra el menú "Más" al cambiar de ruta (ajuste de estado durante el render)
  const [menuPath, setMenuPath] = useState(location.pathname)
  if (menuPath !== location.pathname) {
    setMenuPath(location.pathname)
    setMoreOpen(false)
  }

  // Cierra con Escape (devolviendo el foco al botón) o al pulsar fuera
  useEffect(() => {
    if (!moreOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMoreOpen(false)
        moreButtonRef.current?.focus()
      }
    }
    const onPointer = (e: PointerEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [moreOpen])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <nav aria-label={t('nav.main')} className="bg-neutral-900 sticky top-0 z-50 border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-center h-12 gap-8">
          <NavLink to="/" className={`font-display italic tracking-tight text-xl transition-colors mr-auto ${isHome ? 'text-accent' : 'text-white hover:text-accent'}`}>
            Gainz
          </NavLink>

          {/* Enlaces: solo desde md; en móvil los sustituye el tab bar inferior */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_KEYS.map(({ to, key }) => (
              <NavLink key={to} to={to} className={desktopLink}>
                {t(`nav.${key}`)}
              </NavLink>
            ))}
          </div>

          <div className="ml-auto hidden md:flex items-center gap-3">
            <NavLink to="/profile" className={desktopLink}>
              {t('nav.profile')}
            </NavLink>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-medium tracking-wide text-neutral-400 hover:text-accent transition-colors"
            >
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Tab bar inferior (móvil) ── */}
      {!hideTabBar && (
        <nav
          aria-label={t('nav.tabs')}
          className="md:hidden fixed bottom-0 inset-x-0 z-50 h-16 bg-neutral-900/90 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)] box-content"
        >
          <ul className="flex h-16 items-stretch justify-around">
            {TAB_ITEMS.map(({ to, key, icon, activeIcon, end }) => (
              <li key={to} className="flex-1">
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex h-full min-w-12 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors',
                      isActive ? 'text-accent' : 'text-neutral-400 hover:text-white',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <i aria-hidden="true" className={cn('bi text-2xl leading-none', isActive && activeIcon ? activeIcon : icon)} />
                      {t(`nav.${key}`)}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
            <li ref={moreRef} className="relative flex-1">
              <button
                ref={moreButtonRef}
                type="button"
                aria-expanded={moreOpen}
                aria-controls="more-menu"
                onClick={() => setMoreOpen(v => !v)}
                className={cn(
                  'flex h-full w-full min-w-12 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors',
                  moreOpen || moreActive ? 'text-accent' : 'text-neutral-400 hover:text-white',
                )}
              >
                <i aria-hidden="true" className="bi bi-three-dots text-2xl leading-none" />
                {t('nav.more')}
              </button>

              {moreOpen && (
                <ul
                  id="more-menu"
                  className="absolute bottom-[calc(100%+0.5rem)] right-2 w-56 rounded-2xl border border-white/10 bg-surface-2 p-1.5 shadow-modal"
                >
                  {MORE_ITEMS.map(({ to, key, icon }) => (
                    <li key={to}>
                      <NavLink
                        to={to}
                        className={({ isActive }) =>
                          cn(
                            'flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors hover:bg-white/5',
                            isActive ? 'text-accent' : 'text-neutral-200',
                          )
                        }
                      >
                        <i aria-hidden="true" className={cn('bi text-lg', icon)} />
                        {t(`nav.${key}`)}
                      </NavLink>
                    </li>
                  ))}
                  <li className="mt-1 border-t border-white/10 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
                    >
                      <i aria-hidden="true" className="bi bi-box-arrow-right text-lg" />
                      {t('nav.logout')}
                    </button>
                  </li>
                </ul>
              )}
            </li>
          </ul>
        </nav>
      )}
    </>
  )
}
