import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'

const ROTATION_INTERVAL = 2500

interface AnimatedHeroProps {
  className?: string
}

export default function AnimatedHero({ className }: AnimatedHeroProps) {
  const { t } = useTranslation()
  const [titleIndex, setTitleIndex] = useState(0)

  const titles = t('hero.rotating', { returnObjects: true }) as string[]

  useEffect(() => {
    const timeout = setTimeout(() => {
      setTitleIndex(prev => (prev + 1) % titles.length)
    }, ROTATION_INTERVAL)
    return () => clearTimeout(timeout)
  }, [titleIndex, titles.length])

  return (
    <div className={cn('card header-gradient relative overflow-hidden border-none px-5 py-6 sm:px-8 sm:py-14', className)}>
      <div className="relative z-10 max-w-lg">
        {/* Móvil: una sola línea ("Tu entrenamiento, a otro nivel"); desde sm, título y palabra en dos líneas */}
        <h1 className="text-xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl">
          {t('hero.title')}{' '}
          <span
            key={titleIndex}
            className="inline-block animate-word-in whitespace-nowrap font-display italic text-accent sm:block sm:text-6xl"
          >
            {titles[titleIndex]}
          </span>
        </h1>
        <p className="mt-5 hidden max-w-md text-sm leading-relaxed text-neutral-400 sm:block">
          {t('hero.subtitle')}
        </p>
      </div>

      {/* GAINZ outline */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden select-none items-center justify-center overflow-hidden sm:flex">
        <span
          className="translate-x-[40%] skew-x-[-6deg] font-display text-[160px] font-bold italic leading-none tracking-tight text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.06)] lg:text-[200px]"
        >
          GAINZ
        </span>
      </div>

      {/* Glow esquina derecha */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[20%] -right-[5%] h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(245,196,0,0.14)_0%,rgba(245,196,0,0.05)_40%,transparent_70%)]"
      />

      {/* Línea inferior */}
      <div aria-hidden="true" className="absolute bottom-0 left-5 right-5 h-px bg-gradient-to-r from-accent/40 via-accent/10 to-transparent sm:left-8 sm:right-8" />
    </div>
  )
}
