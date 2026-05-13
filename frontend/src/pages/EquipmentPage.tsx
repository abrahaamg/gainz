import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { equipmentService } from '../services/equipmentService'
import { exerciseService } from '../services/exerciseService'
import { CatalogItem, Equipment } from '../types/equipment'
import type { Exercise } from '../types/exercise'
import { MUSCLE_LABELS, EQUIPMENT_CATEGORY_LABELS as CATEGORY_LABELS } from '../utils/labels'
import GlowCard from '../components/ui/GlowCard'

const LOCATION_KEYS = ['home', 'gym', 'outdoor'] as const

export default function EquipmentPage() {
  const { t } = useTranslation()
  const [items, setItems]               = useState<Equipment[]>([])
  const [catalog, setCatalog]           = useState<CatalogItem[]>([])
  const [accessible, setAccessible]     = useState(0)
  const [bodyweight, setBodyweight]     = useState(0)
  const [showBodyweightList, setShowBodyweightList] = useState(false)
  const [bodyweightExercises, setBodyweightExercises] = useState<Exercise[]>([])
  const [loadingBW, setLoadingBW]       = useState(false)
  const [showEquipmentList, setShowEquipmentList] = useState(false)
  const [equipmentExercises, setEquipmentExercises] = useState<{ id: number; name: string; muscle_group: string }[]>([])
  const [loadingEQ, setLoadingEQ]       = useState(false)
  const [loading, setLoading]           = useState(true)
  const [showModal, setShowModal]       = useState(false)
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState<string | null>(null)

  // Modal state
  const [selectedCatalogId, setSelectedCatalogId] = useState<number | null>(null)
  const [customName, setCustomName]     = useState('')
  const [isCustom, setIsCustom]         = useState(false)
  const [catalogLink, setCatalogLink]   = useState<string | null>(null) // catalog_name for custom equipment
  const [location, setLocation]         = useState('gym')
  const [quantity, setQuantity]         = useState(1)
  const [weightKg, setWeightKg]         = useState<number | null>(null)
  const [notes, setNotes]               = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [eqData, cat] = await Promise.all([
        equipmentService.getAll(),
        equipmentService.getCatalog(),
      ])
      setItems(eqData.items)
      setAccessible(eqData.accessible_exercises)
      setBodyweight(eqData.bodyweight_exercises)
      setCatalog(cat)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const ownedNames = new Set(items.map(i => i.name))
  const availableCatalog = catalog.filter(c => !ownedNames.has(c.name))
  const catalogGrouped = availableCatalog.reduce<Record<string, CatalogItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  const resetModal = () => {
    setSelectedCatalogId(null)
    setCustomName('')
    setIsCustom(false)
    setCatalogLink(null)
    setLocation('gym')
    setQuantity(1)
    setWeightKg(null)
    setNotes('')
    setError(null)
  }

  const openCreate = () => { resetModal(); setShowModal(true) }

  const handleSave = async () => {
    const catItem = catalog.find(c => c.id === selectedCatalogId)
    const name = isCustom ? customName.trim() : catItem?.name
    if (!name) { setError(isCustom ? t('equipment.writeNameError') : t('equipment.selectEquipError')); return }

    setSaving(true); setError(null)
    try {
      await equipmentService.create({
        name,
        catalog_name: isCustom ? (catalogLink || null) : catItem?.name ?? null,
        category: isCustom ? (catalogLink ? catalog.find(c => c.name === catalogLink)?.category ?? 'accessories' : 'accessories') : (catItem?.category ?? null),
        quantity,
        weight_kg: weightKg,
        location,
        notes: notes || null,
      })
      await load()
      setShowModal(false)
    } catch {
      setError(t('equipment.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('equipment.deleteConfirm'))) return
    await equipmentService.delete(id)
    await load()
  }

  const grouped = items.reduce<Record<string, Equipment[]>>((acc, item) => {
    const key = item.category ?? t('equipment.noCategory')
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="card header-gradient px-8 py-8 mb-8 flex items-center justify-between border-none">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t('equipment.title')}</h1>
          <p className="text-neutral-500 text-xs mt-1">{items.length} {t('equipment.elements')}</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          {t('equipment.addNew')}
        </button>
      </div>

      {!loading && (
        <div className="flex flex-col sm:flex-row items-start gap-3 mb-8">
          {/* Peso corporal */}
          <GlowCard className="flex-1 w-full">
            <button
              onClick={async () => {
                if (!showBodyweightList && bodyweightExercises.length === 0) {
                  setLoadingBW(true)
                  const res = await exerciseService.getAll({ requires_equipment: false, limit: 50 })
                  setBodyweightExercises(res.data)
                  setLoadingBW(false)
                }
                setShowBodyweightList(v => !v)
              }}
              className="w-full px-4 py-3 flex items-center gap-3 text-left"
            >
              <span className="text-[11px] font-black uppercase tracking-wider text-white flex-1">
                {t('equipment.bodyweight')} <span className="text-accent">{bodyweight} {t('common.exercises')}</span>
              </span>
              <i className={`bi bi-chevron-down text-neutral-500 text-xs transition-transform duration-300 ${showBodyweightList ? 'rotate-180' : ''}`} />
            </button>
            <div className={`dropdown-panel ${showBodyweightList ? 'open' : ''}`}>
              <div>
                <div className="border-t border-white/10 px-4 py-3 max-h-52 overflow-y-auto">
                  {loadingBW ? (
                    <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">{t('common.loading')}</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {bodyweightExercises.map(ex => (
                        <li key={ex.id} className="text-xs flex justify-between">
                          <span className="text-neutral-300 font-medium">{ex.name}</span>
                          <span className="text-neutral-500 uppercase tracking-wider text-[11px] font-semibold">{MUSCLE_LABELS[ex.muscle_group] ?? ex.muscle_group}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </GlowCard>

          {/* Con equipo */}
          {items.length > 0 && (
            <GlowCard className="flex-1 w-full">
              <button
                onClick={async () => {
                  if (!showEquipmentList && equipmentExercises.length === 0) {
                    setLoadingEQ(true)
                    const exs = await equipmentService.getAccessibleExercises()
                    setEquipmentExercises(exs)
                    setLoadingEQ(false)
                  }
                  setShowEquipmentList(v => !v)
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-left"
              >
                <span className="text-[11px] font-black uppercase tracking-wider text-white flex-1">
                  {t('equipment.withEquipment')} <span className="text-accent">{accessible} {t('common.exercises')}</span>
                </span>
                <i className={`bi bi-chevron-down text-neutral-500 text-xs transition-transform duration-300 ${showEquipmentList ? 'rotate-180' : ''}`} />
              </button>
              <div className={`dropdown-panel ${showEquipmentList ? 'open' : ''}`}>
                <div>
                  <div className="border-t border-white/10 px-4 py-3 max-h-52 overflow-y-auto">
                    {loadingEQ ? (
                      <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">{t('common.loading')}</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {equipmentExercises.map(ex => (
                          <li key={ex.id} className="text-xs flex justify-between">
                            <span className="text-neutral-300 font-medium">{ex.name}</span>
                            <span className="text-neutral-500 uppercase tracking-wider text-[11px] font-semibold">{MUSCLE_LABELS[ex.muscle_group] ?? ex.muscle_group}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </GlowCard>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 card border-dashed">
          <p className="text-neutral-400 text-sm font-medium mb-1">{t('equipment.noEquipment')}</p>
          <p className="text-neutral-300 text-[11px] font-semibold uppercase tracking-wider">{t('equipment.noEquipmentHint')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, catItems]) => {
            const catLabel = CATEGORY_LABELS[cat] ?? cat
            return (
              <div key={cat}>
                <h2 className="section-title">{catLabel}</h2>
                <div className="space-y-2">
                  {catItems.map(item => (
                    <GlowCard key={item.id}>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="font-black text-white">{item.name}</p>
                          <div className="flex gap-3 mt-0.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                            <span>{t(`equipment.${item.location}`, { defaultValue: item.location })}</span>
                            {item.quantity > 1 && <span>x{item.quantity}</span>}
                            {item.weight_kg && <span>{item.weight_kg} kg</span>}
                          </div>
                        </div>
                        <button onClick={() => handleDelete(item.id)} className="btn-danger py-1.5 px-3">{t('common.delete')}</button>
                      </div>
                    </GlowCard>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto">
            <GlowCard>
              <div className="p-6">
            <h2 className="text-xl font-bold text-white tracking-tight mb-6">{t('equipment.addEquipment')}</h2>

            {/* Catalog selector */}
            {!isCustom && (
              <div className="space-y-4 mb-4">
                {Object.entries(catalogGrouped).map(([cat, catItems]) => (
                  <div key={cat}>
                    <p className="section-title mb-2">
                      {CATEGORY_LABELS[cat] ?? cat}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {catItems.map(item => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedCatalogId(prev => prev === item.id ? null : item.id)}
                          className={`chip text-left ${selectedCatalogId === item.id ? 'chip-accent' : ''}`}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {availableCatalog.length === 0 && (
                  <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider text-center py-4">
                    {t('equipment.allCatalog')}
                  </p>
                )}
              </div>
            )}

            {/* Custom toggle */}
            <button
              onClick={() => { setIsCustom(v => !v); setSelectedCatalogId(null) }}
              className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 hover:text-accent transition-colors mb-4"
            >
              {isCustom ? <><i className="bi bi-arrow-left mr-1" />{t('equipment.backToCatalog')}</> : <><i className="bi bi-plus mr-1" />{t('equipment.customEquipment')}</>}
            </button>

            {isCustom && (
              <div className="mb-4 space-y-3">
                <div>
                  <label className="form-label">{t('equipment.nameRequired')}</label>
                  <input
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    placeholder={t('equipment.customNamePlaceholder')}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">{t('equipment.catalogLink')}</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setCatalogLink(null)}
                      className={`chip text-[10px] py-1.5 ${catalogLink === null ? 'chip-active' : ''}`}
                    >
                      {t('common.none')}
                    </button>
                    {catalog.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setCatalogLink(c.name)}
                        className={`chip text-[10px] py-1.5 ${catalogLink === c.name ? 'chip-accent' : ''}`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] font-medium text-neutral-500 mt-2 leading-relaxed">
                    <i className="bi bi-info-circle mr-1" />
                    {catalogLink
                      ? t('equipment.linkedTo', { name: catalogLink })
                      : t('equipment.noLink')}
                  </p>
                </div>
              </div>
            )}

            {/* Common fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="form-label">{t('equipment.location')}</label>
                  <select value={location} onChange={e => setLocation(e.target.value)} className="form-input">
                    {LOCATION_KEYS.map(k => <option key={k} value={k}>{t(`equipment.${k}`)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">{t('equipment.quantity')}</label>
                  <input
                    type="number" min={1}
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">{t('equipment.weight')}</label>
                  <input
                    type="number" min={0} step={0.5}
                    value={weightKg ?? ''}
                    onChange={e => setWeightKg(e.target.value ? Number(e.target.value) : null)}
                    placeholder="—"
                    className="form-input"
                  />
                </div>
              </div>
              <div>
                <label className="form-label">{t('equipment.notes')}</label>
                <input
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-400 font-semibold mt-3 uppercase tracking-wider">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-white/15 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white font-semibold text-xs uppercase tracking-wider px-6 py-2.5 rounded-full transition-all"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 btn-primary py-2.5 disabled:opacity-50"
              >
                {saving ? t('common.saving') : t('common.save')}
              </button>
            </div>
              </div>
            </GlowCard>
          </div>
        </div>
      )}
    </div>
  )
}
