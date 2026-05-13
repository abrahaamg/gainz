import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

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
    <div className={`card header-gradient px-8 py-14 relative overflow-hidden border-none ${className ?? ''}`}>
      <div className="relative z-10 max-w-lg">
        <h1 className="text-4xl sm:text-5xl font-bold text-white leading-[1.15] tracking-tight">
          {t('hero.title')}
          <span className="relative flex w-full overflow-hidden md:pb-2 md:pt-1 h-[1.3em]">
            &nbsp;
            {titles.map((title, index) => (
              <motion.span
                key={index}
                className="absolute font-display italic text-accent text-5xl sm:text-6xl"
                initial={{ opacity: 0, y: 40 }}
                transition={{ type: 'spring', stiffness: 80, damping: 16 }}
                animate={
                  titleIndex === index
                    ? { y: 0, opacity: 1 }
                    : { y: titleIndex > index ? -60 : 60, opacity: 0 }
                }
              >
                {title}
              </motion.span>
            ))}
          </span>
        </h1>
        <p className="text-neutral-400 text-sm mt-5 max-w-md leading-relaxed">
          {t('hero.subtitle')}
        </p>
      </div>

      {/* GAINZ outline */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span
          className="font-display italic text-[120px] sm:text-[160px] lg:text-[200px] leading-none font-bold tracking-tight translate-x-[40%] skew-x-[-6deg]"
          style={{
            WebkitTextStroke: '1px rgba(255,255,255,0.06)',
            color: 'transparent',
          }}
        >
          GAINZ
        </span>
      </div>

      {/* Glow esquina izquierda */}
      <div
        className="absolute -top-[30%] -left-[10%] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(245,196,0,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Glow esquina derecha — más intenso */}
      <div
        className="absolute -bottom-[20%] -right-[5%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(245,196,0,0.18) 0%, rgba(245,196,0,0.06) 40%, transparent 70%)',
        }}
      />

      {/* Línea inferior */}
      <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-accent/40 via-accent/10 to-transparent" />
    </div>
  )
}
