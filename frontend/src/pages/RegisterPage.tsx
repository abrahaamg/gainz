import { useState, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../config/firebase'
import GlowCard from '../components/ui/GlowCard'
import { DEV_MODE } from '../config/authMode'
import { firebaseErrorKey } from '../utils/firebaseErrors'

const googleProvider = new GoogleAuthProvider()

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
    } catch (err: unknown) {
      const key = firebaseErrorKey(err, 'auth.createError')
      if (key) setError(t(key))
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
    } catch (err: unknown) {
      const key = firebaseErrorKey(err, 'auth.registerGoogleError')
      if (key) setError(t(key))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-display italic text-accent tracking-tight">Gainz</h1>
          <p className="text-neutral-400 text-xs font-medium mt-2">{t('auth.createFree')}</p>
        </div>

        <GlowCard glow>
          <div className="p-8">
            <h2 className="text-xl font-bold text-white tracking-tight mb-6">{t('auth.register')}</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="register-email" className="form-label">{t('auth.email')}</label>
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className="form-input form-input-dark"
                />
              </div>

              <div>
                <label htmlFor="register-password" className="form-label">{t('auth.password')}</label>
                <input
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('auth.minPassword')}
                  className="form-input form-input-dark"
                />
              </div>

              <div>
                <label htmlFor="register-confirm" className="form-label">{t('auth.confirmPassword')}</label>
                <input
                  id="register-confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="form-input form-input-dark"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm font-medium normal-case text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-2xl">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary h-12 w-full"
              >
                {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3" role="separator">
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-medium text-neutral-400">{t('common.or')}</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="btn-ghost-dark w-full gap-3 text-sm normal-case tracking-normal"
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 000 24c0 3.77.9 7.35 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              {t('auth.registerGoogle')}
            </button>

            <p className="text-center text-xs text-neutral-400 mt-6">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-accent font-bold hover:text-white transition-colors">
                {t('auth.signIn')}
              </Link>
            </p>
          </div>
        </GlowCard>
      </div>
    </div>
  )
}
