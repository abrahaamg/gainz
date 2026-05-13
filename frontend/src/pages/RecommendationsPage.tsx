import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

/* ─── Types ──────────────────────────────────────────────────── */

interface GeneratedExercise {
  exercise_id: number
  exercise_name: string
  sets: number
  reps: number | null
  duration_seconds: number | null
  rest_seconds: number
  order_index: number
}

interface GeneratedRoutine {
  name: string
  description: string
  goal: string
  difficulty: string
  estimated_duration_min: number
  warmup_notes: string
  cooldown_notes: string
  day_label: string
  exercises: GeneratedExercise[]
}

import { GOAL_LABELS, DIFFICULTY_LABELS as DIFF_LABELS } from '../utils/labels'
import GlowCard from '../components/ui/GlowCard'

/* ─── Component ──────────────────────────────────────────────── */

export default function RecommendationsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [routines, setRoutines] = useState<GeneratedRoutine[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [profileChanged, setProfileChanged] = useState(() => localStorage.getItem('gainz_training_changed') === '1')

  useEffect(() => {
    api.get('/recommendations/generate')
      .then(res => setRoutines(res.data.data))
      .catch(() => setError(t('recommendations.generateError')))
      .finally(() => setLoading(false))
  }, [])

  const regenerate = () => {
    setLoading(true); setError(null); setSaved(false); setExpanded(null)
    setRoutines([])
    localStorage.removeItem('gainz_training_changed')
    setProfileChanged(false)
    api.get('/recommendations/generate')
      .then(res => setRoutines(res.data.data))
      .catch(() => setError(t('recommendations.generateError')))
      .finally(() => setLoading(false))
  }

  const acceptAll = async () => {
    setSaving(true); setError(null)
    try {
      await api.post('/recommendations/accept-all', { routines })
      setSaved(true)
    } catch {
      setError(t('recommendations.saveAllError'))
    } finally {
      setSaving(false)
    }
  }

  const acceptOne = async (routine: GeneratedRoutine) => {
    setSaving(true); setError(null)
    try {
      const res = await api.post('/recommendations/accept', routine)
      navigate(`/routines/${res.data.data.id}`)
    } catch {
      setError(t('recommendations.saveOneError'))
    } finally {
      setSaving(false)
    }
  }

  const formatDuration = (sec: number) => {
    if (sec >= 60) return `${Math.floor(sec / 60)} ${t('common.min')}`
    return `${sec}s`
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="card header-gradient px-8 py-8 mb-8 flex items-center justify-between border-none">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t('recommendations.title')}</h1>
          <p className="text-neutral-500 text-xs mt-1">{t('recommendations.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/equipment" className="btn-secondary">
            {t('recommendations.myEquipment')}
          </Link>
          <button
            onClick={regenerate}
            disabled={loading}
            className="btn-secondary"
          >
            {t('recommendations.regenerate')}
          </button>
        </div>
      </div>

      {/* Aviso de perfil de entrenamiento cambiado */}
      {profileChanged && !loading && (
        <div className="bg-accent/10 border border-accent/20 px-5 py-4 mb-6 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <i className="bi bi-exclamation-triangle-fill text-accent text-lg" />
            <div>
              <p className="text-sm text-white font-bold">{t('recommendations.profileChanged')}</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">{t('recommendations.profileChangedHint')}</p>
            </div>
          </div>
          <button onClick={regenerate} className="btn-primary shrink-0">
            {t('recommendations.regenerate')}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">{t('recommendations.analyzing')}</p>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-sm text-red-500 font-medium mb-4">{error}</p>
          <button onClick={regenerate} className="text-[11px] font-black uppercase tracking-wider text-accent hover:text-accent-dk">
            {t('common.retry')}
          </button>
        </div>
      ) : routines.length === 0 ? (
        <div className="text-center py-16 card border-dashed">
          <p className="text-neutral-400 text-sm font-medium mb-2">{t('recommendations.noRoutines')}</p>
          <p className="text-neutral-300 text-[11px] font-semibold uppercase tracking-wider mb-4">
            {t('recommendations.noRoutinesHint')}
          </p>
          <Link to="/onboarding" className="text-[11px] font-black uppercase tracking-wider text-accent hover:text-accent-dk">
            {t('recommendations.completeProfile')}
          </Link>
        </div>
      ) : (
        <>
          {/* Summary */}
          <GlowCard className="mb-6">
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-black">
                  {routines.length} {t('recommendations.weeklySessions')}
                </p>
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-0.5">
                  {GOAL_LABELS[routines[0]?.goal] ?? routines[0]?.goal} — {DIFF_LABELS[routines[0]?.difficulty] ?? routines[0]?.difficulty}
                </p>
              </div>
              {!saved && (
                <button
                  onClick={acceptAll}
                  disabled={saving}
                  className="btn-primary disabled:opacity-50"
                >
                  {saving ? t('common.saving') : t('recommendations.acceptAll')}
                </button>
              )}
              {saved && (
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-black text-green-400 uppercase tracking-wider">
                    <i className="bi bi-check-circle-fill mr-1" />{t('recommendations.allSaved')}
                  </span>
                  <Link to="/routines" className="btn-primary">
                    {t('recommendations.seeMyRoutines')}
                  </Link>
                </div>
              )}
            </div>
          </GlowCard>

          {/* Routine cards */}
          <div className="space-y-3">
            {routines.map((routine, idx) => {
              const isExpanded = expanded === idx
              return (
                <GlowCard key={idx}>
                  {/* Header */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : idx)}
                    className="w-full px-5 py-4 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-black text-white text-base">{routine.name}</h2>
                        <div className="flex flex-wrap gap-4 mt-1 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                          <span>{routine.exercises.length} {t('common.exercises')}</span>
                          <span>{routine.estimated_duration_min} {t('common.min')}</span>
                          <span>{routine.day_label}</span>
                        </div>
                      </div>
                      <i className={`bi bi-chevron-down text-neutral-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Expanded details */}
                  <div className={`dropdown-panel ${isExpanded ? 'open' : ''}`}>
                    <div>
                    <div className="border-t border-white/10 px-5 py-5">
                      <p className="text-xs text-neutral-500 mb-5">{routine.description}</p>

                      <div className="mb-5">
                        <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.12em] mb-2">{t('recommendations.warmup')}</p>
                        <p className="text-xs text-neutral-500 whitespace-pre-line">{routine.warmup_notes}</p>
                      </div>

                      <div className="mb-5">
                        <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.12em] mb-2">{t('recommendations.exercisesSection')}</p>
                        <div className="space-y-2">
                          {routine.exercises.map((ex, exIdx) => (
                            <div key={exIdx} className="flex items-center justify-between px-3 py-2.5 bg-white/5 border border-white/5 rounded-xl">
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] font-black text-accent w-5">{ex.order_index}</span>
                                <span className="text-sm font-bold text-white">{ex.exercise_name}</span>
                              </div>
                              <div className="flex gap-4 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                {ex.reps ? (
                                  <span>{ex.sets}x{ex.reps}</span>
                                ) : (
                                  <span>{formatDuration(ex.duration_seconds!)}</span>
                                )}
                                <span>{ex.rest_seconds}s {t('recommendations.restLabel')}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mb-5">
                        <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.12em] mb-2">{t('recommendations.cooldown')}</p>
                        <p className="text-xs text-neutral-500">{routine.cooldown_notes}</p>
                      </div>

                      {!saved && (
                        <button
                          onClick={() => acceptOne(routine)}
                          disabled={saving}
                          className="btn-primary disabled:opacity-50"
                        >
                          {t('recommendations.saveRoutine')}
                        </button>
                      )}
                    </div>
                    </div>
                  </div>
                </GlowCard>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
