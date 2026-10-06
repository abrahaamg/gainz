import { useState, FormEvent, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/useAuthStore'
import { authService } from '../services/authService'
import { apiErrorMessage } from '../utils/apiError'
import GlowCard from '../components/ui/GlowCard'
import PageHeader from '../components/ui/PageHeader'
import { setTrainingChanged } from '../utils/trainingFlag'

const GOAL_KEYS: Record<string, string> = {
  fat_loss:         'onboarding.goalFatLoss',
  hypertrophy:      'onboarding.goalHypertrophy',
  strength:         'onboarding.goalStrength',
  v_shape:          'onboarding.goalVShape',
  glutes_legs:      'onboarding.goalGlutesLegs',
  cardio_endurance: 'onboarding.goalCardio',
  athletic:         'onboarding.goalAthletic',
  general_fitness:  'onboarding.goalGeneralFitness',
  improve_lifts:    'onboarding.goalImproveLifts',
}

function calcAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function ProfilePage() {
  const { t } = useTranslation()
  const { mysqlUser, setMysqlUser } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const [username, setUsername]     = useState(mysqlUser?.username ?? '')
  const [birthDate, setBirthDate]   = useState(mysqlUser?.birth_date ?? '')
  const [weightKg, setWeightKg]     = useState(mysqlUser?.weight_kg ?? '')
  const [heightCm, setHeightCm]     = useState(mysqlUser?.height_cm ?? '')
  const [fitnessLevel, setFitnessLevel] = useState(mysqlUser?.fitness_level ?? '')
  const [experience, setExperience] = useState(mysqlUser?.experience ?? '')
  const [primaryGoal, setPrimaryGoal] = useState(mysqlUser?.primary_goal ?? '')
  const [sessionDuration, setSessionDuration] = useState(mysqlUser?.session_duration_min ?? '')

  const SEX_OPTIONS = [
    { value: 'male',   label: t('profile.male') },
    { value: 'female', label: t('profile.female') },
    { value: 'other',  label: t('profile.other') },
  ]

  const FITNESS_LEVELS = [
    { value: 'beginner',     label: t('profile.beginner') },
    { value: 'intermediate', label: t('profile.intermediate') },
    { value: 'advanced',     label: t('profile.advanced') },
  ]

  const EXPERIENCE_OPTIONS = [
    { value: 'none',    label: t('profile.noExperience') },
    { value: '0-1',     label: t('profile.lessThan1Year') },
    { value: '1-3',     label: t('profile.oneToThreeYears') },
    { value: '3-5',     label: t('profile.threeToFiveYears') },
    { value: '5+',      label: t('profile.moreThan5Years') },
  ]

  // Detectar si cambió algo del entrenamiento respecto al original
  const trainingChanged = useMemo(() => {
    if (!mysqlUser) return false
    return (
      fitnessLevel !== (mysqlUser.fitness_level ?? '') ||
      experience !== (mysqlUser.experience ?? '') ||
      primaryGoal !== (mysqlUser.primary_goal ?? '') ||
      String(sessionDuration) !== String(mysqlUser.session_duration_min ?? '')
    )
  }, [fitnessLevel, experience, primaryGoal, sessionDuration, mysqlUser])

  const age = birthDate ? calcAge(birthDate) : null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const updated = await authService.updateProfile({
        username: username || null,
        birth_date: birthDate || null,
        age: age,
        weight_kg: weightKg ? Number(weightKg) : null,
        height_cm: heightCm ? Number(heightCm) : null,
        fitness_level: fitnessLevel || null,
        experience: experience || null,
        primary_goal: primaryGoal || null,
        session_duration_min: sessionDuration ? Number(sessionDuration) : null,
      })
      setMysqlUser(updated)
      // Si cambió entrenamiento, marcar flag para aviso en recomendaciones
      if (trainingChanged) {
        setTrainingChanged(mysqlUser?.id)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: unknown) {
      setError(apiErrorMessage(err, t('profile.saveError')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        leading={
          <div aria-hidden="true" className="w-14 h-14 shrink-0 rounded-full bg-accent/20 flex items-center justify-center text-xl font-bold text-accent ring-2 ring-accent/30">
            {(mysqlUser?.username?.[0] ?? mysqlUser?.email?.[0] ?? 'U').toUpperCase()}
          </div>
        }
        title={mysqlUser?.username || t('profile.title')}
        subtitle={mysqlUser?.email ?? undefined}
        actions={
          <div className="hidden sm:flex items-center gap-6">
            {age !== null && (
              <div className="text-center">
                <p className="text-xs font-medium text-neutral-400">{t('profile.calculatedAge').replace(':', '')}</p>
                <p className="text-sm font-bold text-accent mt-0.5">{age} {t('common.years')}</p>
              </div>
            )}
            {mysqlUser?.fitness_level && (
              <div className="text-center">
                <p className="text-xs font-medium text-neutral-400">{t('profile.level')}</p>
                <p className="text-sm font-bold text-accent mt-0.5">
                  {FITNESS_LEVELS.find(f => f.value === mysqlUser.fitness_level)?.label ?? mysqlUser.fitness_level}
                </p>
              </div>
            )}
            {mysqlUser?.primary_goal && (
              <div className="text-center">
                <p className="text-xs font-medium text-neutral-400">{t('profile.mainGoal')}</p>
                <p className="text-sm font-bold text-accent mt-0.5">
                  {GOAL_KEYS[mysqlUser.primary_goal] ? t(GOAL_KEYS[mysqlUser.primary_goal]) : mysqlUser.primary_goal}
                </p>
              </div>
            )}
          </div>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos personales */}
        <GlowCard>
          <div className="p-6">
            <h2 className="section-title mb-4">{t('profile.personalData')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="profile-1" className="form-label">{t('profile.username')}</label>
                <input id="profile-1"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={t('profile.usernamePlaceholder')}
                  className="form-input form-input-dark"
                />
              </div>
              <div>
                <label htmlFor="profile-2" className="form-label">{t('auth.email')}</label>
                <input id="profile-2"
                  type="email"
                  value={mysqlUser?.email ?? ''}
                  disabled
                  className="w-full px-4 py-3 text-sm rounded-2xl bg-white/3 border border-white/5 text-neutral-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="form-label">{t('profile.sex')}</label>
                <div className="w-full px-4 py-3 text-sm rounded-2xl bg-white/3 border border-white/5 text-neutral-400 cursor-not-allowed">
                  {SEX_OPTIONS.find(o => o.value === mysqlUser?.sex)?.label ?? t('profile.notDefined')}
                </div>
              </div>
              <div>
                <label htmlFor="profile-3" className="form-label">{t('profile.birthDate')}</label>
                <input id="profile-3"
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 text-sm rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
              {age !== null && (
                <div className="flex items-center gap-2 sm:col-span-2">
                  <span className="text-xs font-medium text-neutral-400">{t('profile.calculatedAge')}</span>
                  <span className="text-sm font-bold text-accent">{age} {t('common.years')}</span>
                </div>
              )}
            </div>
          </div>
        </GlowCard>

        {/* Medidas corporales */}
        <GlowCard>
          <div className="p-6">
            <h2 className="section-title mb-4">{t('profile.bodyMeasures')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="profile-4" className="form-label">{t('profile.weightKg')}</label>
                <input id="profile-4"
                  type="number"
                  min={30}
                  max={300}
                  step={0.1}
                  value={weightKg}
                  onChange={e => setWeightKg(e.target.value ? Number(e.target.value) : '')}
                  placeholder="75"
                  className="form-input form-input-dark"
                />
              </div>
              <div>
                <label htmlFor="profile-5" className="form-label">{t('profile.heightCm')}</label>
                <input id="profile-5"
                  type="number"
                  min={100}
                  max={250}
                  value={heightCm}
                  onChange={e => setHeightCm(e.target.value ? Number(e.target.value) : '')}
                  placeholder="175"
                  className="form-input form-input-dark"
                />
              </div>
            </div>
            {weightKg && heightCm ? (() => {
              const imc = Number(weightKg) / (Number(heightCm) / 100) ** 2
              const imcLabel = imc < 18.5 ? t('profile.underweight') : imc < 25 ? t('profile.normal') : imc < 30 ? t('profile.overweight') : t('profile.obesity')
              const imcColor = imc < 18.5 ? 'text-blue-400' : imc < 25 ? 'text-green-400' : imc < 30 ? 'text-orange-400' : 'text-red-400'
              return (
                <div className="mt-4 bg-accent/5 border border-accent/10 px-4 py-3 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-neutral-400">{t('profile.bmi')}</p>
                    <p className="text-2xl font-bold text-white mt-0.5">{imc.toFixed(1)}</p>
                  </div>
                  <span className={`text-xs font-black uppercase tracking-wider ${imcColor}`}>{imcLabel}</span>
                </div>
              )
            })() : null}
          </div>
        </GlowCard>

        {/* Entrenamiento */}
        <GlowCard>
          <div className="p-6">
            <h2 className="section-title mb-4">{t('profile.training')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="profile-6" className="form-label">{t('profile.level')}</label>
                <select id="profile-6"
                  value={fitnessLevel}
                  onChange={e => setFitnessLevel(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                >
                  <option value="">{t('profile.select')}</option>
                  {FITNESS_LEVELS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="profile-7" className="form-label">{t('profile.experience')}</label>
                <select id="profile-7"
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                >
                  <option value="">{t('profile.select')}</option>
                  {EXPERIENCE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="profile-8" className="form-label">{t('profile.mainGoal')}</label>
                <select id="profile-8"
                  value={primaryGoal}
                  onChange={e => setPrimaryGoal(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                >
                  <option value="">{t('profile.select')}</option>
                  {Object.entries(GOAL_KEYS).map(([val, key]) => (
                    <option key={val} value={val}>{t(key)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="profile-9" className="form-label">{t('profile.sessionDuration')}</label>
                <select id="profile-9"
                  value={sessionDuration}
                  onChange={e => setSessionDuration(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-3 text-sm rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                >
                  <option value="">{t('profile.select')}</option>
                  {[30, 45, 60, 90, 120].map(min => (
                    <option key={min} value={min}>{min} min</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Aviso de cambio de entrenamiento */}
            {trainingChanged && (
              <div className="mt-4 bg-accent/10 border border-accent/20 px-4 py-3 rounded-2xl flex items-center gap-3">
                <i className="bi bi-exclamation-triangle-fill text-accent" />
                <p className="text-xs text-accent font-semibold">
                  {t('profile.trainingChanged')}
                </p>
              </div>
            )}
          </div>
        </GlowCard>

        {/* Feedback */}
        {error && (
          <p role="alert" className="text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-2xl">
            {error}
          </p>
        )}

        {/* Guardar */}
        <div className="flex items-center gap-4 sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6 z-10">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary py-3 px-10 shadow-lg"
          >
            {saving ? t('common.saving') : t('profile.saveChanges')}
          </button>
          {saved && (
            <span role="status" className="text-xs font-bold text-green-400 bg-green-500/10 backdrop-blur px-3 py-2 rounded-full">
              <i className="bi bi-check-circle-fill mr-1" />{t('common.saved')}
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
