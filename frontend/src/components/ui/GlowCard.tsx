import React, { useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface GlowCardProps {
  children: React.ReactNode
  className?: string
}

export default function GlowCard({ children, className }: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)

  const applyTransform = useCallback((rx: number, ry: number, hovered: boolean) => {
    const el = cardRef.current
    if (!el) return
    const y = hovered ? -4 : 0
    el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(${y}px)`
    // Actualizar opacidades de capas internas via CSS variables
    el.style.setProperty('--glow-opacity', hovered ? '0.9' : '0.7')
    el.style.setProperty('--glow-center-opacity', hovered ? '0.85' : '0.6')
    el.style.setProperty('--glass-opacity', hovered ? '0.7' : '0.4')
    el.style.setProperty('--line-opacity', hovered ? '1' : '0.8')
    el.style.setProperty('--line-shadow', hovered
      ? '0 0 20px 4px rgba(245,196,0,0.7), 0 0 30px 6px rgba(201,162,0,0.5), 0 0 40px 8px rgba(245,196,0,0.3)'
      : '0 0 15px 3px rgba(245,196,0,0.5), 0 0 25px 5px rgba(201,162,0,0.3)')
    el.style.setProperty('--edge-shadow', hovered
      ? '0 0 15px 3px rgba(245,196,0,0.6)'
      : '0 0 10px 2px rgba(245,196,0,0.3)')
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const el = cardRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      applyTransform(-(y / rect.height) * 4, (x / rect.width) * 4, true)
    })
  }, [applyTransform])

  const handleMouseEnter = useCallback(() => {
    applyTransform(0, 0, true)
  }, [applyTransform])

  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    applyTransform(0, 0, false)
  }, [applyTransform])

  return (
    <div
      ref={cardRef}
      className={cn('glow-card relative rounded-apple overflow-hidden', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* Reflejo de cristal */}
      <div
        className="glow-card__glass absolute inset-0 z-[35] pointer-events-none"
      />

      {/* Fondo negro */}
      <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #111 100%)' }} />

      {/* Textura noise */}
      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Glow dorado inferior */}
      <div className="glow-card__glow absolute bottom-0 left-0 right-0 h-2/3 z-20" />

      {/* Glow central */}
      <div className="glow-card__glow-center absolute bottom-0 left-0 right-0 h-2/3 z-[21]" />

      {/* Línea inferior brillante */}
      <div className="glow-card__line absolute bottom-0 left-0 right-0 h-[2px] z-[25]" />

      {/* Bordes laterales glow */}
      <div className="glow-card__edge absolute bottom-0 left-0 h-1/4 w-[1px] z-[25] rounded-full" />
      <div className="glow-card__edge absolute bottom-0 right-0 h-1/4 w-[1px] z-[25] rounded-full" />

      {/* Contenido */}
      <div className="relative z-40 h-full">
        {children}
      </div>
    </div>
  )
}
