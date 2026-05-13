import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/useAuthStore'
import api from '../services/api'
import { equipmentService } from '../services/equipmentService'
import { CatalogItem } from '../types/equipment'

/* ─── Constants ─────────────────────────────────────────────── */

const GOAL_KEYS = [
  { value: 'fat_loss',          key: 'onboarding.goalFatLoss' },
  { value: 'hypertrophy',       key: 'onboarding.goalHypertrophy' },
  { value: 'strength',          key: 'onboarding.goalStrength' },
  { value: 'v_shape',           key: 'onboarding.goalVShape' },
  { value: 'glutes_legs',       key: 'onboarding.goalGlutesLegs' },
  { value: 'cardio_endurance',  key: 'onboarding.goalCardio' },
  { value: 'athletic',          key: 'onboarding.goalAthletic' },
  { value: 'general_fitness',   key: 'onboarding.goalGeneralFitness' },
  { value: 'improve_lifts',     key: 'onboarding.goalImproveLifts' },
]

const EXPERIENCE_KEYS = [
  { value: 'none',          key: 'onboarding.expNone' },
  { value: 'less_than_1y',  key: 'onboarding.expLessThan1' },
  { value: '1_to_3y',       key: 'onboarding.exp1to3' },
  { value: 'more_than_3y',  key: 'onboarding.expMore3' },
]

const FITNESS_LEVEL_KEYS = [
  { value: 'beginner',     key: 'onboarding.beginner' },
  { value: 'intermediate', key: 'onboarding.intermediate' },
  { value: 'advanced',     key: 'onboarding.advanced' },
]

const DAY_KEYS = [
  { value: 'monday',    key: 'onboarding.monday' },
  { value: 'tuesday',   key: 'onboarding.tuesday' },
  { value: 'wednesday', key: 'onboarding.wednesday' },
  { value: 'thursday',  key: 'onboarding.thursday' },
  { value: 'friday',    key: 'onboarding.friday' },
  { value: 'saturday',  key: 'onboarding.saturday' },
  { value: 'sunday',    key: 'onboarding.sunday' },
]

const DURATIONS = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
  { value: 90, label: '90 min' },
]

const INJURY_OPTIONS = [
  'shoulder', 'knee', 'lower_back', 'wrist', 'hip', 'ankle', 'neck', 'elbow',
]

const INJURY_KEYS: Record<string, string> = {
  shoulder: 'onboarding.injShoulder',
  knee: 'onboarding.injKnee',
  lower_back: 'onboarding.injLowerBack',
  wrist: 'onboarding.injWrist',
  hip: 'onboarding.injHip',
  ankle: 'onboarding.injAnkle',
  neck: 'onboarding.injNeck',
  elbow: 'onboarding.injElbow',
}

const CATEGORY_KEYS: Record<string, string> = {
  free_weights: 'onboarding.freeWeights',
  benches: 'onboarding.benches',
  machines: 'onboarding.machines',
  cardio: 'onboarding.cardio',
  accessories: 'onboarding.accessories',
}

const STEP_LABEL_KEYS = [
  'onboarding.profileStep',
  'onboarding.goalsStep',
  'onboarding.equipmentStep',
  'onboarding.availabilityStep',
]

/* ─── Component ─────────────────────────────────────────────── */

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { mysqlUser } = useAuth()
  const setMysqlUser = useAuthStore(s => s.setMysqlUser)

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1 — Profile
  const [username, setUsername] = useState(mysqlUser?.username ?? '')
  const [sex, setSex] = useState<string>('unspecified')
  const [age, setAge] = useState<number | ''>('')
  const [weightKg, setWeightKg] = useState<number | ''>('')
  const [heightCm, setHeightCm] = useState<number | ''>('')
  const [experience, setExperience] = useState('none')
  const [fitnessLevel, setFitnessLevel] = useState('beginner')

  // Step 2 — Goals
  const [primaryGoal, setPrimaryGoal] = useState('')
  const [goals, setGoals] = useState<string[]>([])

  // Step 3 — Equipment
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<Set<number>>(new Set())

  // Step 4 — Availability
  const [availableDays, setAvailableDays] = useState<string[]>([])
  const [sessionDuration, setSessionDuration] = useState(60)
  const [injuries, setInjuries] = useState<string[]>([])

  useEffect(() => {
    equipmentService.getCatalog().then(setCatalog).catch(() => {})
  }, [])

  useEffect(() => {
    if (mysqlUser?.onboarding_done) navigate('/', { replace: true })
  }, [mysqlUser?.onboarding_done])

  const toggleGoal = (g: string) => {
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
    if (!primaryGoal) setPrimaryGoal(g)
  }

  const toggleEquipment = (id: number) => {
    setSelectedEquipment(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleDay = (d: string) => {
    setAvailableDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  const toggleInjury = (i: string) => {
    setInjuries(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])
  }

  const canNext = (): boolean => {
    if (step === 1) return !!username.trim() && age !== '' && weightKg !== '' && heightCm !== ''
    if (step === 2) return !!primaryGoal && goals.length > 0
    if (step === 3) return true
    if (step === 4) return availableDays.length >= 2
    return false
  }

  const handleFinish = async () => {
    setSaving(true); setError(null)
    try {
      // 1. Save profile
      const profileRes = await api.patch('/auth/me', {
        username: username.trim(),
        sex,
        age: age || null,
        fitness_level: fitnessLevel,
        experience,
        weight_kg: weightKg || null,
        height_cm: heightCm || null,
        goals,
        primary_goal: primaryGoal,
        available_days: availableDays,
        session_duration_min: sessionDuration,
        injuries: injuries.length ? injuries : null,
        onboarding_done: true,
      })

      // 2. Save equipment (ignore individual errors — may already exist)
      for (const catId of selectedEquipment) {
        const item = catalog.find(c => c.id === catId)
        if (item) {
          try {
            await equipmentService.create({
              name: item.name,
              catalog_name: item.name,
              category: item.category,
              location: 'gym',
            })
          } catch { /* equipo duplicado, ignorar */ }
        }
      }

      // 3. Update local state and navigate
      setMysqlUser({ ...profileRes.data.data, onboarding_done: true })
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Onboarding error:', err)
      setError(t('onboarding.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const catalogGrouped = catalog.reduce<Record<string, CatalogItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-neutral-50 flex items-start justify-center px-4 py-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-display italic text-neutral-900 tracking-tight">Gainz</h1>
          <p className="text-neutral-400 text-[11px] font-semibold uppercase tracking-[0.15em] mt-1">
            {t('onboarding.step')} {step} {t('onboarding.of4')} {t(STEP_LABEL_KEYS[step - 1])}
          </p>
          {/* Progress bar */}
          <div className="flex gap-2 mt-3 justify-center">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`h-1 w-14 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-accent' : 'bg-neutral-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-white border border-neutral-100 shadow-soft rounded-apple p-6">
          {/* ─── STEP 1: Perfil ─── */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-black text-neutral-900 tracking-tight mb-1">{t('onboarding.yourProfile')}</h2>
              <p className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider mb-4">{t('onboarding.profileHint')}</p>

              <div className="space-y-3">
                <div>
                  <label className="form-label">{t('onboarding.username')}</label>
                  <input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder={t('onboarding.usernamePlaceholder')}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">{t('onboarding.sex')}</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'male', key: 'onboarding.male' },
                      { value: 'female', key: 'onboarding.female' },
                      { value: 'unspecified', key: 'onboarding.preferNotSay' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setSex(opt.value)}
                        className={`flex-1 chip ${sex === opt.value ? 'chip-accent' : ''}`}
                      >
                        {t(opt.key)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="form-label">{t('onboarding.age')}</label>
                    <input
                      type="number" min={14} max={99}
                      value={age}
                      onChange={e => setAge(e.target.value ? Number(e.target.value) : '')}
                      placeholder="25"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">{t('onboarding.weightKg')}</label>
                    <input
                      type="number" min={30} max={250} step={0.1}
                      value={weightKg}
                      onChange={e => setWeightKg(e.target.value ? Number(e.target.value) : '')}
                      placeholder="70"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">{t('onboarding.heightCm')}</label>
                    <input
                      type="number" min={100} max={250}
                      value={heightCm}
                      onChange={e => setHeightCm(e.target.value ? Number(e.target.value) : '')}
                      placeholder="175"
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">{t('onboarding.experience')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {EXPERIENCE_KEYS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setExperience(opt.value)}
                        className={`chip ${experience === opt.value ? 'chip-accent' : ''}`}
                      >
                        {t(opt.key)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="form-label">{t('onboarding.fitnessLevel')}</label>
                  <div className="flex gap-2">
                    {FITNESS_LEVEL_KEYS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setFitnessLevel(opt.value)}
                        className={`flex-1 chip ${fitnessLevel === opt.value ? 'chip-accent' : ''}`}
                      >
                        {t(opt.key)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Objetivos ─── */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-black text-neutral-900 tracking-tight mb-1">{t('onboarding.yourGoals')}</h2>
              <p className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider mb-4">{t('onboarding.goalsHint')}</p>

              <div className="space-y-2 mb-6">
                {GOAL_KEYS.map(g => {
                  const selected = goals.includes(g.value)
                  const isPrimary = primaryGoal === g.value
                  return (
                    <button
                      key={g.value}
                      onClick={() => toggleGoal(g.value)}
                      className={`w-full border px-4 py-3 text-left text-sm flex items-center justify-between transition-all duration-150 ${
                        selected
                          ? 'border-accent bg-accent/10 font-bold text-neutral-900 shadow-sm'
                          : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                      }`}
                    >
                      <span>{t(g.key)}</span>
                      {isPrimary && (
                        <span className="text-[10px] uppercase tracking-widest text-accent font-black">{t('onboarding.primary')}</span>
                      )}
                    </button>
                  )
                })}
              </div>

              {goals.length > 1 && (
                <div>
                  <label className="form-label">{t('onboarding.mainGoal')}</label>
                  <div className="flex flex-wrap gap-2">
                    {goals.map(g => (
                      <button
                        key={g}
                        onClick={() => setPrimaryGoal(g)}
                        className={`chip ${primaryGoal === g ? 'chip-active' : ''}`}
                      >
                        {t(GOAL_KEYS.find(x => x.value === g)?.key ?? g)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 3: Equipamiento ─── */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-black text-neutral-900 tracking-tight mb-1">{t('onboarding.yourEquipment')}</h2>
              <p className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider mb-4">
                {t('onboarding.equipmentHint')}
              </p>

              <div className="space-y-5 max-h-[50vh] overflow-y-auto pr-1">
                {Object.entries(catalogGrouped).map(([cat, catItems]) => (
                  <div key={cat}>
                    <p className="section-title mb-2">
                      {t(CATEGORY_KEYS[cat] ?? cat)}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {catItems.map(item => {
                        const selected = selectedEquipment.has(item.id)
                        return (
                          <button
                            key={item.id}
                            onClick={() => toggleEquipment(item.id)}
                            className={`chip text-left ${selected ? 'chip-accent' : ''}`}
                          >
                            {item.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] font-semibold text-neutral-400 mt-4 uppercase tracking-wider">
                {selectedEquipment.size} {t('onboarding.selected')}
              </p>
            </div>
          )}

          {/* ─── STEP 4: Disponibilidad ─── */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-black text-neutral-900 tracking-tight mb-1">{t('onboarding.yourAvailability')}</h2>
              <p className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider mb-4">
                {t('onboarding.availabilityHint')}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="form-label">{t('onboarding.trainingDays')}</label>
                  <div className="grid grid-cols-4 gap-2">
                    {DAY_KEYS.map(d => {
                      const selected = availableDays.includes(d.value)
                      return (
                        <button
                          key={d.value}
                          onClick={() => toggleDay(d.value)}
                          className={`chip ${selected ? 'chip-accent' : ''}`}
                        >
                          {t(d.key).slice(0, 3)}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="form-label">{t('onboarding.sessionDuration')}</label>
                  <div className="flex gap-2">
                    {DURATIONS.map(d => (
                      <button
                        key={d.value}
                        onClick={() => setSessionDuration(d.value)}
                        className={`flex-1 chip ${sessionDuration === d.value ? 'chip-accent' : ''}`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="form-label">{t('onboarding.injuries')}</label>
                  <div className="grid grid-cols-4 gap-2">
                    {INJURY_OPTIONS.map(i => {
                      const selected = injuries.includes(i)
                      return (
                        <button
                          key={i}
                          onClick={() => toggleInjury(i)}
                          className={`chip ${
                            selected
                              ? 'border-red-400 bg-red-50 font-bold text-red-700'
                              : ''
                          }`}
                        >
                          {t(INJURY_KEYS[i])}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[11px] text-neutral-300 mt-2 uppercase tracking-wider font-medium">
                    {t('onboarding.injuriesHint')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ─── Error ─── */}
          {error && <p className="text-xs text-red-600 font-semibold mt-5 uppercase tracking-wide">{error}</p>}

          {/* ─── Navigation ─── */}
          <div className="flex gap-3 mt-5">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 btn-secondary py-2.5"
              >
                {t('common.back')}
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext()}
                className="flex-1 btn-primary py-2.5 disabled:opacity-30"
              >
                {t('common.next')}
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving || !canNext()}
                className="flex-1 btn-primary py-2.5 disabled:opacity-30"
              >
                {saving ? t('common.saving') : t('onboarding.startTraining')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
