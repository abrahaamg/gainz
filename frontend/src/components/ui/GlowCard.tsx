import React, { useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface GlowCardProps {
  children: React.ReactNode
  className?: string
  /**
   * Activa el efecto completo (glow dorado, reflejo e inclinación con puntero).
   * Reservado para la tarjeta principal de la pantalla (CTA o descanso): máximo una.
   */
  glow?: boolean
}

const hasPointer = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(hover: hover)').matches

export default function GlowCard({ children, className, glow = false }: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)

  const applyTransform = useCallback((rx: number, ry: number, hovered: boolean) => {
    const el = cardRef.current
    if (!el) return
    const y = hovered ? -4 : 0
    el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(${y}px)`
    // Actualizar opacidades de capas internas via CSS variables
    el.style.setProperty('--glow-opacity', hovered ? '0.55' : '0.35')
    el.style.setProperty('--glow-center-opacity', hovered ? '0.5' : '0.3')
    el.style.setProperty('--glass-opacity', hovered ? '0.5' : '0.3')
    el.style.setProperty('--line-opacity', hovered ? '1' : '0.7')
    el.style.setProperty('--line-shadow', hovered
      ? '0 0 16px 3px rgba(245,196,0,0.55), 0 0 26px 5px rgba(201,162,0,0.35)'
      : '0 0 12px 2px rgba(245,196,0,0.4), 0 0 20px 4px rgba(201,162,0,0.2)')
    el.style.setProperty('--edge-shadow', hovered
      ? '0 0 12px 3px rgba(245,196,0,0.45)'
      : '0 0 8px 2px rgba(245,196,0,0.25)')
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasPointer()) return
    const { clientX, clientY } = e
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const el = cardRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = clientX - rect.left - rect.width / 2
      const y = clientY - rect.top - rect.height / 2
      applyTransform(-(y / rect.height) * 4, (x / rect.width) * 4, true)
    })
  }, [applyTransform])

  const handleMouseEnter = useCallback(() => {
    if (hasPointer()) applyTransform(0, 0, true)
  }, [applyTransform])

  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    if (hasPointer()) applyTransform(0, 0, false)
  }, [applyTransform])

  // Variante por defecto: tarjeta sobria, sin capas ni interacción
  if (!glow) {
    return (
      <div className={cn('glow-card relative rounded-apple overflow-hidden', className)}>
        <div className="relative z-40 h-full">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={cardRef}
      className={cn('glow-card glow-card--glow relative rounded-apple overflow-hidden', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* Reflejo de cristal */}
      <div className="glow-card__glass absolute inset-0 z-[35] pointer-events-none" />

      {/* Fondo negro */}
      <div className="absolute inset-0 z-0 bg-surface" />

      {/* Glow dorado inferior */}
      <div className="glow-card__glow absolute bottom-0 left-0 right-0 h-2/3 z-20 pointer-events-none" />

      {/* Glow central */}
      <div className="glow-card__glow-center absolute bottom-0 left-0 right-0 h-2/3 z-[21] pointer-events-none" />

      {/* Línea inferior brillante */}
      <div className="glow-card__line absolute bottom-0 left-0 right-0 h-[2px] z-[25] pointer-events-none" />

      {/* Bordes laterales glow */}
      <div className="glow-card__edge absolute bottom-0 left-0 h-1/4 w-[1px] z-[25] rounded-full pointer-events-none" />
      <div className="glow-card__edge absolute bottom-0 right-0 h-1/4 w-[1px] z-[25] rounded-full pointer-events-none" />

      {/* Contenido */}
      <div className="relative z-40 h-full">
        {children}
      </div>
    </div>
  )
}
