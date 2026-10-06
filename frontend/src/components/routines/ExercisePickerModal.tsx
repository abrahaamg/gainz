import { useId, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../ui/Modal'
import GlowCard from '../ui/GlowCard'
import Spinner from '../ui/Spinner'
import ErrorState from '../ui/ErrorState'
import { searchCatalog } from '../../utils/routineImport/match'
import { label } from '../../utils/labels'

export interface PickerExercise {
  id: number
  name: string
  muscle_group: string
}

interface Props<T extends PickerExercise> {
  open: boolean
  onClose: () => void
  onSelect: (exercise: T) => void
  catalog: T[]
  loading?: boolean
  error?: boolean
  onRetry?: () => void
  title: string
  /** Candidatos propuestos (se enseñan arriba mientras no se busca). */
  suggestions?: T[]
  /** Contenido extra al final (p. ej. "Crear como ejercicio propio"). */
  footer?: ReactNode
}

/** Selector de ejercicio con búsqueda sobre el catálogo (búsqueda local, sin tildes). */
export default function ExercisePickerModal<T extends PickerExercise>({
  open, onClose, onSelect, catalog, loading, error, onRetry, title, suggestions = [], footer,
}: Props<T>) {
  const { t } = useTranslation()
  const titleId = useId()
  const [query, setQuery] = useState('')
  const results = searchCatalog(query, catalog, 40)
  const showSuggestions = query.trim() === '' && suggestions.length > 0

  const close = () => {
    setQuery('')
    onClose()
  }
  const pick = (ex: T) => {
    setQuery('')
    onSelect(ex)
  }

  const item = (ex: T) => (
    <li key={ex.id}>
      <button
        type="button"
        onClick={() => pick(ex)}
        className="flex min-h-[44px] w-full items-center justify-between gap-3 border-b border-white/5 px-4 py-2.5 text-left text-sm transition-colors last:border-0 hover:bg-accent/10"
      >
        <span className="min-w-0 font-bold text-white">{ex.name}</span>
        <span className="shrink-0 text-xs text-neutral-400">{label('muscles', ex.muscle_group)}</span>
      </button>
    </li>
  )

  return (
    <Modal open={open} onClose={close} labelledBy={titleId} placement="sheet">
      <GlowCard className="rounded-b-none sm:rounded-b-apple">
        <div className="flex max-h-[85vh] flex-col p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id={titleId} className="text-lg font-bold text-white">{title}</h2>
            <button type="button" onClick={close} className="btn-ghost-dark px-3 py-1.5 text-xs">
              {t('common.close')}
            </button>
          </div>

          <label htmlFor={`${titleId}-q`} className="sr-only">{t('routines.searchExercise')}</label>
          <input
            id={`${titleId}-q`}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('routines.searchExercise')}
            autoComplete="off"
            className="form-input form-input-dark mb-3"
          />

          <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
            {loading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : error ? (
              <ErrorState bare message={t('routines.catalogError')} onRetry={onRetry} />
            ) : (
              <>
                {showSuggestions && (
                  <div className="mb-3">
                    <p className="section-title mb-1.5">{t('routineImport.suggestions')}</p>
                    <ul className="overflow-hidden rounded-2xl border border-accent/30 bg-accent/5">
                      {suggestions.map(item)}
                    </ul>
                  </div>
                )}
                {results.length === 0 ? (
                  <p role="status" className="py-6 text-center text-sm text-neutral-400">{t('routines.noResults')}</p>
                ) : (
                  <ul className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                    {results.map(item)}
                  </ul>
                )}
              </>
            )}
          </div>

          {footer && <div className="mt-3 border-t border-white/10 pt-3">{footer}</div>}
        </div>
      </GlowCard>
    </Modal>
  )
}
