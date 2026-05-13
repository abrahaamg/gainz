import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { exerciseService } from '../services/exerciseService'
import { useDebounce } from '../hooks/useDebounce'
import { Exercise, ExerciseCategory, Difficulty } from '../types/exercise'
import { CATEGORY_LABELS, DIFFICULTY_LABELS, translateMuscle } from '../utils/labels'
import DifficultyDots from '../components/ui/DifficultyDots'
import GlowCard from '../components/ui/GlowCard'

const CATEGORIES: ExerciseCategory[] = ['strength', 'cardio', 'flexibility', 'hiit', 'balance']

export default function ExercisesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  const [search, setSearch]       = useState('')
  const [category, setCategory]   = useState<ExerciseCategory | ''>('')
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('')

  const debouncedSearch = useDebounce(search, 300)
  const LIMIT = 12

  useEffect(() => { setPage(1) }, [debouncedSearch, category, difficulty])

  useEffect(() => {
    setLoading(true)
    setError(null)
    exerciseService.getAll({
      q: debouncedSearch || undefined,
      category: category || undefined,
      difficulty: difficulty || undefined,
      page,
      limit: LIMIT,
    }).then(result => {
      setExercises(result.data)
      setTotal(result.pagination.total)
    }).catch(() => setError(t('exercises.loadError')))
    .finally(() => setLoading(false))
  }, [debouncedSearch, category, difficulty, page])

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="card header-gradient px-8 py-8 mb-8 flex items-center justify-between border-none">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t('exercises.title')}</h1>
          <p className="text-neutral-500 text-xs mt-1">{total} {t('exercises.inCatalog')}</p>
        </div>
        <button
          onClick={() => navigate('/exercises/new')}
          className="btn-primary"
        >
          {t('exercises.new')}
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder={t('exercises.searchPlaceholder')}
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full form-input mb-4"
      />

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => setCategory('')}
          className={`chip ${category === '' ? 'chip-active' : ''}`}
        >
          {t('common.allMasc')}
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat === category ? '' : cat)}
            className={`chip ${category === cat ? 'chip-active' : ''}`}
          >
            {t(`categories.${cat}`)}
          </button>
        ))}
      </div>

      {/* Difficulty filter */}
      <div className="flex gap-2 mb-8">
        {(['', 'easy', 'medium', 'hard'] as const).map(d => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className={`chip ${difficulty === d ? 'chip-active' : ''}`}
          >
            {d === '' ? t('common.all') : t(`difficulty.${d}`)}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-neutral-100 h-32 rounded-apple animate-pulse" />
          ))}
        </div>
      )}

      {error && <div className="border border-red-200 bg-red-50 text-red-600 p-4 text-sm font-medium rounded-2xl">{error}</div>}

      {!loading && !error && exercises.length === 0 && (
        <div className="text-center py-16 text-neutral-400 text-sm font-medium">{t('exercises.notFound')}</div>
      )}

      {!loading && !error && exercises.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {exercises.map(exercise => (
            <GlowCard key={exercise.id} className="cursor-pointer">
              <div
                onClick={() => navigate(`/exercises/${exercise.id}`)}
                className="p-5"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 bg-white/5 px-2.5 py-1 rounded-full">
                    {t(`categories.${exercise.category}`)}
                  </span>
                  <DifficultyDots level={exercise.difficulty} />
                </div>
                <h3 className="font-bold text-white mb-1 leading-tight">{exercise.name}</h3>
                <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                  {translateMuscle(exercise.muscle_group)}
                </p>
                {exercise.requires_equipment && (
                  <p className="mt-2 text-[11px] font-medium text-neutral-500">
                    <i className="bi bi-tools mr-1" />{t('exercises.requiresEquipment')}
                  </p>
                )}
              </div>
            </GlowCard>
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="btn-secondary disabled:opacity-30"
          >
            {t('common.previous')}
          </button>
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="btn-secondary disabled:opacity-30"
          >
            {t('common.next')}
          </button>
        </div>
      )}
    </div>
  )
}
