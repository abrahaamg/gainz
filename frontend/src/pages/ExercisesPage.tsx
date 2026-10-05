import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { exerciseService } from '../services/exerciseService'
import { useDebounce } from '../hooks/useDebounce'
import { useAsync } from '../hooks/useAsync'
import { ExerciseCategory, Difficulty } from '../types/exercise'
import { translateMuscle } from '../utils/labels'
import DifficultyDots from '../components/ui/DifficultyDots'
import GlowCard from '../components/ui/GlowCard'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'

const CATEGORIES: ExerciseCategory[] = ['strength', 'cardio', 'flexibility', 'hiit', 'balance']

export default function ExercisesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage]           = useState(1)

  const [search, setSearch]       = useState('')
  const [category, setCategory]   = useState<ExerciseCategory | ''>('')
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('')

  const debouncedSearch = useDebounce(search, 300)
  const LIMIT = 12

  // Cada handler de filtro vuelve a la página 1 en el mismo evento (sin efecto aparte)
  const changeSearch     = (v: string) => { setSearch(v); setPage(1) }
  const changeCategory   = (v: ExerciseCategory | '') => { setCategory(v); setPage(1) }
  const changeDifficulty = (v: Difficulty | '') => { setDifficulty(v); setPage(1) }

  const { data: result, loading, error, reload } = useAsync(
    () => exerciseService.getAll({
      q: debouncedSearch || undefined,
      category: category || undefined,
      difficulty: difficulty || undefined,
      page,
      limit: LIMIT,
    }),
    [debouncedSearch, category, difficulty, page],
  )
  const exercises = result?.data ?? []
  const total = result?.pagination.total ?? 0

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div>
      <PageHeader
        title={t('exercises.title')}
        subtitle={`${total} ${t('exercises.inCatalog')}`}
        actions={
          <button onClick={() => navigate('/exercises/new')} className="btn-primary">
            {t('exercises.new')}
          </button>
        }
      />

      {/* Search */}
      <input
        type="search"
        aria-label={t('exercises.searchPlaceholder')}
        placeholder={t('exercises.searchPlaceholder')}
        value={search}
        onChange={e => changeSearch(e.target.value)}
        className="w-full form-input mb-4"
      />

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => changeCategory('')}
          className={`chip ${category === '' ? 'chip-active' : ''}`}
        >
          {t('common.allMasc')}
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => changeCategory(cat === category ? '' : cat)}
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
            onClick={() => changeDifficulty(d)}
            className={`chip ${difficulty === d ? 'chip-active' : ''}`}
          >
            {d === '' ? t('common.all') : t(`difficulty.${d}`)}
          </button>
        ))}
      </div>

      {loading && (
        <div role="status" aria-busy="true" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <span className="sr-only">{t('common.loading')}</span>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-apple" />
          ))}
        </div>
      )}

      {!!error && !loading && <ErrorState message={t('exercises.loadError')} onRetry={reload} />}

      {!loading && !error && exercises.length === 0 && (
        <EmptyState
          icon="bi-search"
          title={t('exercises.notFound')}
          description={t('exercises.notFoundHint')}
        />
      )}

      {!loading && !error && exercises.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {exercises.map(exercise => (
            <GlowCard key={exercise.id}>
              <Link
                to={`/exercises/${exercise.id}`}
                className="block p-5 transition-colors hover:bg-white/[0.03]"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-semibold text-neutral-400 bg-white/5 px-2.5 py-1 rounded-full">
                    {t(`categories.${exercise.category}`)}
                  </span>
                  <DifficultyDots level={exercise.difficulty} />
                </div>
                <h3 className="font-bold text-white mb-1 leading-tight">{exercise.name}</h3>
                <p className="text-xs font-medium text-neutral-400">
                  {translateMuscle(exercise.muscle_group)}
                </p>
                {exercise.requires_equipment && (
                  <p className="mt-2 text-xs font-medium text-neutral-400">
                    <i className="bi bi-tools mr-1" />{t('exercises.requiresEquipment')}
                  </p>
                )}
              </Link>
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
          <span className="text-xs font-medium text-neutral-400">
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
