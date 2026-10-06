import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  loadPref, savePref, applyTheme, applyContrast, applyReducedMotion, applyFontSize,
  type FontSize, type Theme, type Contrast,
} from '../../utils/a11yPrefs'

const FONT_SIZE_VALUES: { value: FontSize; labelKey: string }[] = [
  { value: 'normal',     labelKey: 'accessibility.normal' },
  { value: 'grande',     labelKey: 'accessibility.large' },
  { value: 'muy-grande', labelKey: 'accessibility.veryLarge' },
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

export default function AccessibilityPanel() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [fontSize, setFontSize] = useState<FontSize>(() => loadPref('fontSize', 'normal'))
  const [theme, setTheme]       = useState<Theme>(() => loadPref('theme', 'claro'))
  const [contrast, setContrast] = useState<Contrast>(() => loadPref('contrast', 'normal'))
  const [reducedMotion, setReducedMotion] = useState(() => loadPref('reducedMotion', false))

  // ── Apply font size ──
  useEffect(() => {
    applyFontSize(fontSize)
    savePref('fontSize', fontSize)
  }, [fontSize])

  // ── Apply theme ──
  useEffect(() => {
    applyTheme(theme)
    savePref('theme', theme)
  }, [theme])

  // ── Apply contrast ──
  useEffect(() => {
    applyContrast(contrast)
    savePref('contrast', contrast)
  }, [contrast])

  // ── Apply reduced motion ──
  useEffect(() => {
    applyReducedMotion(reducedMotion)
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
        className="fixed z-[60] top-[calc(env(safe-area-inset-top)+0.125rem)] right-2 md:top-auto md:bottom-5 md:right-5 w-11 h-11 md:w-12 md:h-12 text-neutral-300 hover:text-accent md:bg-neutral-900 md:dark:bg-white md:text-white md:dark:text-neutral-900 md:shadow-lg md:hover:shadow-xl rounded-full transition-all duration-200 flex items-center justify-center"
      >
        <i className="bi bi-universal-access text-xl" />
      </button>

      {/* ── Panel ── */}
      {open && (
        <div className="fixed top-[calc(env(safe-area-inset-top)+3.5rem)] md:top-auto md:bottom-20 right-4 md:right-5 z-[60] w-[min(20rem,calc(100vw-2rem))] bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-100 dark:border-neutral-700 shadow-modal rounded-apple max-h-[80vh] overflow-y-auto">
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
                    className={`flex-1 chip text-xs py-1.5 ${fontSize === f.value ? 'chip-active' : 'dark:border-neutral-600 dark:text-neutral-400'}`}
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
                    <kbd className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 px-2 py-0.5 font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      {s.keys}
                    </kbd>
                    <span className="text-neutral-500 dark:text-neutral-400 text-xs">{t(s.actionKey)}</span>
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
              className="w-full mt-4 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors py-2"
            >
              <i className="bi bi-arrow-counterclockwise mr-1" />{t('accessibility.resetAll')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
