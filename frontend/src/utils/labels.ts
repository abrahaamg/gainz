import i18n from '../i18n'

// ─── Helpers que leen de i18n en tiempo real ─────────────────

function tLabel(ns: string, key: string): string {
  return i18n.t(`${ns}.${key}`, { defaultValue: key.replace(/_/g, ' ') })
}

// ─── Objetos-proxy que devuelven la traducción actual ────────
// Se usan como GOAL_LABELS[key], MUSCLE_LABELS[key], etc.
// Al ser Proxy, siempre llaman a i18n.t() → reflejan el idioma activo.

function createLabelProxy(ns: string): Record<string, string> {
  return new Proxy({} as Record<string, string>, {
    get(_target, prop: string) {
      return tLabel(ns, prop)
    },
  })
}

export const GOAL_LABELS = createLabelProxy('goals')
export const DIFFICULTY_LABELS = createLabelProxy('difficulty')
export const CATEGORY_LABELS = createLabelProxy('categories')
export const MUSCLE_LABELS = createLabelProxy('muscles')
export const EQUIPMENT_CATEGORY_LABELS = createLabelProxy('equipmentCategories')

/** Traduce un muscle_group al idioma actual */
export function translateMuscle(key: string): string {
  return tLabel('muscles', key)
}
