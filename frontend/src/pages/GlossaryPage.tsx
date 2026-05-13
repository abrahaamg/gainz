import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import GlowCard from '../components/ui/GlowCard'

// --- Tipos ---

type Category = 'training' | 'anatomy' | 'nutrition' | 'metrics'

interface Term {
  name: string
  category: Category
  definition: string
  example?: string
}

// --- Datos ---

const CATEGORIES: { key: Category | 'all'; i18nKey: string }[] = [
  { key: 'all',       i18nKey: 'common.all' },
  { key: 'training',  i18nKey: 'glossary.training' },
  { key: 'anatomy',   i18nKey: 'glossary.anatomy' },
  { key: 'nutrition',  i18nKey: 'glossary.nutrition' },
  { key: 'metrics',   i18nKey: 'glossary.metrics' },
]

const CATEGORY_COLORS: Record<Category, string> = {
  training:  'bg-amber-900/40 text-amber-400',
  anatomy:   'bg-emerald-900/40 text-emerald-400',
  nutrition: 'bg-sky-900/40 text-sky-400',
  metrics:   'bg-violet-900/40 text-violet-400',
}

const CATEGORY_I18N: Record<Category, string> = {
  training:  'glossary.training',
  anatomy:   'glossary.anatomy',
  nutrition: 'glossary.nutrition',
  metrics:   'glossary.metrics',
}

// --- Componente ---

export default function GlossaryPage() {
  const { t } = useTranslation()
  const [busqueda, setBusqueda] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState<Category | 'all'>('all')

  const terms = t('glossary.termsData', { returnObjects: true }) as Term[]

  const terminosFiltrados = useMemo(() => {
    const query = busqueda.toLowerCase().trim()
    return terms.filter((term) => {
      const coincideCategoria = categoriaActiva === 'all' || term.category === categoriaActiva
      const coincideBusqueda =
        !query ||
        term.name.toLowerCase().includes(query) ||
        term.definition.toLowerCase().includes(query)
      return coincideCategoria && coincideBusqueda
    })
  }, [busqueda, categoriaActiva, terms])

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="card header-gradient px-8 py-8 mb-8 border-none">
        <h1 className="text-2xl font-bold text-white tracking-tight">{t('glossary.title')}</h1>
        <p className="text-neutral-500 text-xs mt-1">
          {t('glossary.subtitle')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Buscador */}
        <div className="relative">
          <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none z-10" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={t('glossary.searchPlaceholder')}
            className="form-input pl-10 rounded-full"
          />
        </div>

        {/* Filtros por categoria */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(({ key, i18nKey }) => (
            <button
              key={key}
              onClick={() => setCategoriaActiva(key)}
              className={`chip ${categoriaActiva === key ? 'chip-active' : ''}`}
            >
              {t(i18nKey)}
            </button>
          ))}
        </div>

        {/* Contador de resultados */}
        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
          {terminosFiltrados.length} {terminosFiltrados.length === 1 ? t('glossary.term') : t('glossary.terms')}
        </p>

        {/* Grid de terminos */}
        {terminosFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-neutral-500">{t('glossary.noResults')}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {terminosFiltrados.map((termino) => (
              <GlowCard key={termino.name}>
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-white font-black text-lg leading-tight">
                      {termino.name}
                    </h3>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${CATEGORY_COLORS[termino.category]}`}
                    >
                      {t(CATEGORY_I18N[termino.category])}
                    </span>
                  </div>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    {termino.definition}
                  </p>
                  {termino.example && (
                    <p className="text-neutral-500 text-sm italic">
                      {termino.example}
                    </p>
                  )}
                </div>
              </GlowCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
