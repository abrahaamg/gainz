import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

type FontSize = 'normal' | 'grande' | 'muy-grande'
type Theme = 'claro' | 'oscuro'
type Contrast = 'normal' | 'alto'

const FONT_SIZE_VALUES: { value: FontSize; labelKey: string; scale: string }[] = [
  { value: 'normal',     labelKey: 'accessibility.normal',    scale: '100%' },
  { value: 'grande',     labelKey: 'accessibility.large',     scale: '115%' },
  { value: 'muy-grande', labelKey: 'accessibility.veryLarge', scale: '130%' },
]

const SHORTCUT_KEYS: { keys: string; actionKey: string }[] = [
  { keys: 'Alt + A', actionKey: 'accessibility.shortcutPanel' },
  { keys: 'Alt + D', actionKey: 'accessibility.shortcutTheme' },
  { keys: 'Alt + C', actionKey: 'accessibility.shortcutContrast' },
  { keys: 'Alt + +', actionKey: 'accessibility.shortcutFontUp' },
  { keys: 'Alt + -', actionKey: 'accessibility.shortcutFontDown' },
  { keys: 'Tab',     actionKey: 'accessibility.shortcutTab' },
  { keys: 'Enter',   actionKey: 'accessibility.shortcutEnter' },
  { keys: 'Escape',  actionKey: 'accessibility.shortcutEsc' },
]

function loadPref<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(`gainz_a11y_${key}`)
    return v ? (JSON.parse(v) as T) : fallback
  } catch { return fallback }
}
function savePref(key: string, value: unknown) {
  localStorage.setItem(`gainz_a11y_${key}`, JSON.stringify(value))
}

export default function AccessibilityPanel() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [fontSize, setFontSize] = useState<FontSize>(() => loadPref('fontSize', 'normal'))
  const [theme, setTheme]       = useState<Theme>(() => loadPref('theme', 'claro'))
  const [contrast, setContrast] = useState<Contrast>(() => loadPref('contrast', 'normal'))
  const [reducedMotion, setReducedMotion] = useState(() => loadPref('reducedMotion', false))

  // ── Apply font size ──
  useEffect(() => {
    const scale = FONT_SIZE_VALUES.find(f => f.value === fontSize)?.scale ?? '100%'
    document.documentElement.style.fontSize = scale
    savePref('fontSize', fontSize)
  }, [fontSize])

  // ── Apply theme ──
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'oscuro')
    savePref('theme', theme)
  }, [theme])

  // ── Apply contrast ──
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', contrast === 'alto')
    savePref('contrast', contrast)
  }, [contrast])

  // ── Apply reduced motion ──
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion)
    savePref('reducedMotion', reducedMotion)
  }, [reducedMotion])

  // ── Cycle font size ──
  const cycleFontUp = useCallback(() => {
    setFontSize(prev => {
      const idx = FONT_SIZE_VALUES.findIndex(f => f.value === prev)
      return FONT_SIZE_VALUES[Math.min(idx + 1, FONT_SIZE_VALUES.length - 1)].value
    })
  }, [])
  const cycleFontDown = useCallback(() => {
    setFontSize(prev => {
      const idx = FONT_SIZE_VALUES.findIndex(f => f.value === prev)
      return FONT_SIZE_VALUES[Math.max(idx - 1, 0)].value
    })
  }, [])

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey) return

      switch (e.key.toLowerCase()) {
        case 'a':
          e.preventDefault()
          setOpen(v => !v)
          break
        case 'd':
          e.preventDefault()
          setTheme(v => v === 'claro' ? 'oscuro' : 'claro')
          break
        case 'c':
          e.preventDefault()
          setContrast(v => v === 'normal' ? 'alto' : 'normal')
          break
        case '+':
        case '=':
          e.preventDefault()
          cycleFontUp()
          break
        case '-':
          e.preventDefault()
          cycleFontDown()
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cycleFontUp, cycleFontDown])

  // ── Close on Escape ──
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={t('accessibility.title')}
        title={t('accessibility.openPanel')}
        className="fixed bottom-5 right-5 z-50 w-12 h-12 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105"
      >
        <i className="bi bi-universal-access text-xl" />
      </button>

      {/* ── Panel ── */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-80 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-100 dark:border-neutral-700 shadow-modal rounded-apple max-h-[80vh] overflow-y-auto">
          <div className="p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-black text-neutral-900 dark:text-white tracking-tight">
                <i className="bi bi-universal-access mr-2" />{t('accessibility.title')}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                aria-label={t('accessibility.closePanel')}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            {/* ── Font size ── */}
            <div className="mb-5">
              <label className="form-label dark:text-neutral-400">{t('accessibility.fontSize')}</label>
              <div className="flex gap-1.5">
                {FONT_SIZE_VALUES.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFontSize(f.value)}
                    className={`flex-1 chip text-[10px] py-1.5 ${fontSize === f.value ? 'chip-active' : 'dark:border-neutral-600 dark:text-neutral-400'}`}
                  >
                    {t(f.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Theme ── */}
            <div className="mb-5">
              <label className="form-label dark:text-neutral-400">{t('accessibility.theme')}</label>
              <div className="flex gap-1.5">
                {([
                  { value: 'claro' as Theme, labelKey: 'accessibility.light', icon: 'bi-sun' },
                  { value: 'oscuro' as Theme, labelKey: 'accessibility.dark', icon: 'bi-moon-stars' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`flex-1 chip py-2 ${theme === opt.value ? 'chip-active' : 'dark:border-neutral-600 dark:text-neutral-400'}`}
                  >
                    <i className={`bi ${opt.icon} mr-1.5`} />{t(opt.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Contrast ── */}
            <div className="mb-5">
              <label className="form-label dark:text-neutral-400">{t('accessibility.contrast')}</label>
              <div className="flex gap-1.5">
                {([
                  { value: 'normal' as Contrast, labelKey: 'accessibility.normal' },
                  { value: 'alto' as Contrast, labelKey: 'accessibility.highContrast' },
                ] as const).map(c => (
                  <button
                    key={c.value}
                    onClick={() => setContrast(c.value)}
                    className={`flex-1 chip py-2 ${contrast === c.value ? 'chip-active' : 'dark:border-neutral-600 dark:text-neutral-400'}`}
                  >
                    {t(c.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Reduced motion ── */}
            <div className="mb-6">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={e => setReducedMotion(e.target.checked)}
                  className="w-4 h-4 accent-accent"
                />
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('accessibility.reduceAnimations')}</span>
              </label>
            </div>

            {/* ── Shortcuts legend ── */}
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
              <p className="form-label dark:text-neutral-400 mb-3">{t('accessibility.shortcuts')}</p>
              <div className="space-y-2">
                {SHORTCUT_KEYS.map(s => (
                  <div key={s.keys} className="flex items-center justify-between text-xs">
                    <kbd className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 px-2 py-0.5 font-mono text-[10px] font-bold text-neutral-700 dark:text-neutral-300">
                      {s.keys}
                    </kbd>
                    <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">{t(s.actionKey)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Reset ── */}
            <button
              onClick={() => {
                setFontSize('normal')
                setTheme('claro')
                setContrast('normal')
                setReducedMotion(false)
              }}
              className="w-full mt-4 text-[11px] font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors py-2"
            >
              <i className="bi bi-arrow-counterclockwise mr-1" />{t('accessibility.resetAll')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
