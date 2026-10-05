import i18n from '../i18n'

export type LabelNamespace = 'goals' | 'difficulty' | 'categories' | 'muscles' | 'equipmentCategories'

/** Traduce `ns.key` al idioma actual; si no existe, devuelve la clave legible. */
export function label(ns: LabelNamespace, key: string): string {
  return i18n.t(`${ns}.${key}`, { defaultValue: key.replace(/_/g, ' ') })
}

/** Traduce un muscle_group al idioma actual */
export function translateMuscle(key: string): string {
  return label('muscles', key)
}
