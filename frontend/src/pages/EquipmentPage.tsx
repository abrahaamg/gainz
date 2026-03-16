import { useEffect, useState } from 'react'
import { equipmentService } from '../services/equipmentService'
import { CreateEquipmentPayload, Equipment } from '../types/equipment'

const CATEGORIES = [
  { value: 'free_weights', label: 'Pesos libres' },
  { value: 'machines',     label: 'Máquinas' },
  { value: 'cardio',       label: 'Cardio' },
  { value: 'bodyweight',   label: 'Peso corporal' },
  { value: 'accessories',  label: 'Accesorios' },
]

const LOCATIONS = [
  { value: 'home', label: '🏠 Casa' },
  { value: 'gym',  label: '🏋️ Gimnasio' },
  { value: 'outdoor', label: '🌳 Exterior' },
]

const CAT_COLORS: Record<string, string> = {
  free_weights: 'bg-blue-100 text-blue-800',
  machines:     'bg-purple-100 text-purple-800',
  cardio:       'bg-red-100 text-red-800',
  bodyweight:   'bg-green-100 text-green-800',
  accessories:  'bg-orange-100 text-orange-800',
}

const emptyForm = (): CreateEquipmentPayload => ({
  name: '', category: null, quantity: 1, weight_kg: null, location: 'home', notes: null,
})

export default function EquipmentPage() {
  const [items, setItems]             = useState<Equipment[]>([])
  const [accessible, setAccessible]   = useState(0)
  const [loading, setLoading]         = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [editing, setEditing]         = useState<Equipment | null>(null)
  const [form, setForm]               = useState<CreateEquipmentPayload>(emptyForm())
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    equipmentService.getAll()
      .then(({ items, accessible_exercises }) => {
        setItems(items)
        setAccessible(accessible_exercises)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setShowModal(true) }
  const openEdit   = (item: Equipment) => {
    setEditing(item)
    setForm({ name: item.name, category: item.category, quantity: item.quantity, weight_kg: item.weight_kg, location: item.location, notes: item.notes })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true); setError(null)
    try {
      if (editing) {
        const updated = await equipmentService.update(editing.id, form)
        setItems(prev => prev.map(i => i.id === editing.id ? updated : i))
      } else {
        const created = await equipmentService.create(form)
        setItems(prev => [...prev, created])
      }
      // Refresh accessible count
      equipmentService.getAll().then(({ accessible_exercises }) => setAccessible(accessible_exercises))
      setShowModal(false)
    } catch {
      setError('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este equipo?')) return
    await equipmentService.delete(id)
    setItems(prev => prev.filter(i => i.id !== id))
    equipmentService.getAll().then(({ accessible_exercises }) => setAccessible(accessible_exercises))
  }

  // Group by category
  const grouped = items.reduce<Record<string, Equipment[]>>((acc, item) => {
    const key = item.category ?? 'sin categoría'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Mi Equipamiento</h1>
        <button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm"
        >
          + Añadir equipo
        </button>
      </div>

      {/* Access indicator */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-3 mb-6 flex items-center gap-3">
        <span className="text-2xl">⚡</span>
        <p className="text-indigo-800 font-medium">
          Con este equipo tienes acceso a{' '}
          <strong className="text-indigo-600">{accessible} ejercicios</strong>
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🏋️</p>
          <p className="font-medium">No tienes equipo registrado</p>
          <p className="text-sm mt-1">Añade tu equipamiento para obtener recomendaciones personalizadas</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, catItems]) => {
            const catLabel = CATEGORIES.find(c => c.value === cat)?.label ?? cat
            return (
              <div key={cat}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{catLabel}</h2>
                <div className="space-y-2">
                  {catItems.map(item => (
                    <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <div className="flex gap-2 mt-0.5 text-xs text-gray-400">
                            <span>{LOCATIONS.find(l => l.value === item.location)?.label ?? item.location}</span>
                            {item.quantity > 1 && <span>· ×{item.quantity}</span>}
                            {item.weight_kg && <span>· {item.weight_kg}kg</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${CAT_COLORS[item.category ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>
                          {catLabel}
                        </span>
                        <button onClick={() => openEdit(item)} className="text-sm text-indigo-600 hover:underline">Editar</button>
                        <button onClick={() => handleDelete(item.id)} className="text-sm text-red-500 hover:underline">Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editing ? 'Editar equipo' : 'Añadir equipo'}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nombre *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder='ej. "Barra olímpica"'
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Categoría</label>
                  <select
                    value={form.category ?? ''}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value || null }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Sin categoría</option>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ubicación</label>
                  <select
                    value={form.location ?? 'home'}
                    onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    {LOCATIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Cantidad</label>
                  <input
                    type="number" min={1}
                    value={form.quantity ?? 1}
                    onChange={e => setForm(p => ({ ...p, quantity: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Peso (kg, si aplica)</label>
                  <input
                    type="number" min={0} step={0.5}
                    value={form.weight_kg ?? ''}
                    onChange={e => setForm(p => ({ ...p, weight_kg: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="—"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Notas</label>
                <input
                  value={form.notes ?? ''}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value || null }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-60"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
