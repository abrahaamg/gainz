export type FontSize = 'normal' | 'grande' | 'muy-grande'
export type Theme = 'claro' | 'oscuro'
export type Contrast = 'normal' | 'alto'

export const FONT_SCALES: Record<FontSize, string> = {
  'normal': '100%',
  'grande': '115%',
  'muy-grande': '130%',
}

export function loadPref<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(`gainz_a11y_${key}`)
    return v ? (JSON.parse(v) as T) : fallback
  } catch { return fallback }
}

export function savePref(key: string, value: unknown) {
  try {
    localStorage.setItem(`gainz_a11y_${key}`, JSON.stringify(value))
  } catch { /* localStorage no disponible */ }
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'oscuro')
}
export function applyContrast(contrast: Contrast) {
  document.documentElement.classList.toggle('high-contrast', contrast === 'alto')
}
export function applyReducedMotion(reduced: boolean) {
  document.documentElement.classList.toggle('reduce-motion', reduced)
}
export function applyFontSize(size: FontSize) {
  document.documentElement.style.fontSize = FONT_SCALES[size] ?? FONT_SCALES.normal
}

/**
 * Aplica las preferencias guardadas antes de montar React: las rutas fuera del
 * Layout (/login, /register, /onboarding) se renderizan ya con el tema guardado.
 */
export function applyStoredA11yPrefs() {
  applyTheme(loadPref<Theme>('theme', 'claro'))
  applyContrast(loadPref<Contrast>('contrast', 'normal'))
  applyReducedMotion(loadPref<boolean>('reducedMotion', false))
  applyFontSize(loadPref<FontSize>('fontSize', 'normal'))
}
