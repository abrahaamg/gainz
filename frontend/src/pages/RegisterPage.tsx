import { useState, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../config/firebase'
import GlowCard from '../components/ui/GlowCard'

const googleProvider = new GoogleAuthProvider()
const DEV_MODE = !import.meta.env.VITE_FIREBASE_PROJECT_ID

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (DEV_MODE) {
      navigate('/onboarding', { replace: true })
      return
    }

    if (password !== confirm) {
      setError(t('auth.passwordMismatch'))
      return
    }
    if (password.length < 6) {
      setError(t('auth.passwordTooShort'))
      return
    }

    setLoading(true)
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      navigate('/onboarding', { replace: true })
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'auth/email-already-in-use') {
        setError(t('auth.emailInUse'))
      } else if (code === 'auth/invalid-email') {
        setError(t('auth.invalidEmail'))
      } else {
        setError(t('auth.createError'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)

    if (DEV_MODE) {
      navigate('/onboarding', { replace: true })
      return
    }

    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
      navigate('/onboarding', { replace: true })
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code !== 'auth/popup-closed-by-user') {
        setError(t('auth.registerGoogleError'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #111 50%, #0e100f 100%)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-display italic text-accent tracking-tight">Gainz</h1>
          <p className="text-neutral-500 text-[11px] font-semibold uppercase tracking-[0.15em] mt-2">{t('auth.createFree')}</p>
        </div>

        <GlowCard>
          <div className="p-8">
            <h2 className="text-xl font-bold text-white tracking-tight mb-6">{t('auth.register')}</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">{t('auth.email')}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className="w-full px-4 py-3 text-sm rounded-2xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">{t('auth.password')}</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('auth.minPassword')}
                  className="w-full px-4 py-3 text-sm rounded-2xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">{t('auth.confirmPassword')}</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-2xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>

              {error && (
                <p className="text-xs text-red-400 font-semibold uppercase tracking-wide bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-2xl">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3"
              >
                {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
              <div className="relative flex justify-center"><span className="px-3 text-[10px] font-bold text-neutral-600 uppercase tracking-widest" style={{ background: '#0e100f' }}>{t('common.or')}</span></div>
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 border border-white/10 bg-white/5 hover:bg-white/10 py-3 font-bold text-sm text-neutral-300 transition-all duration-200 rounded-full"
            >
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 000 24c0 3.77.9 7.35 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              {t('auth.registerGoogle')}
            </button>

            <p className="text-center text-xs text-neutral-500 uppercase tracking-wide mt-6">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-accent font-black hover:text-white transition-colors">
                {t('auth.signIn')}
              </Link>
            </p>
          </div>
        </GlowCard>
      </div>
    </div>
  )
}
