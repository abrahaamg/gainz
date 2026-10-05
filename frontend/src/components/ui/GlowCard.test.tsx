import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import GlowCard from './GlowCard'

describe('GlowCard', () => {
  it('renderiza el contenido hijo', () => {
    render(<GlowCard><p>Contenido test</p></GlowCard>)
    expect(screen.getByText('Contenido test')).toBeInTheDocument()
  })

  it('aplica la clase glow-card', () => {
    const { container } = render(<GlowCard><p>Test</p></GlowCard>)
    expect(container.firstElementChild?.className).toContain('glow-card')
  })

  it('acepta className adicional', () => {
    const { container } = render(<GlowCard className="col-span-2"><p>Test</p></GlowCard>)
    expect(container.firstElementChild?.className).toContain('col-span-2')
  })

  it('por defecto es sobria: sin capas de efecto ni variante glow', () => {
    const { container } = render(<GlowCard><p>Test</p></GlowCard>)
    const card = container.firstElementChild!
    expect(card.className).not.toContain('glow-card--glow')
    expect(card.querySelector('.glow-card__glow')).toBeNull()
    expect(card.children.length).toBe(1)
  })

  it('con glow tiene las capas internas (glass, glow, línea) y sin ruido SVG', () => {
    const { container } = render(<GlowCard glow><p>Test</p></GlowCard>)
    const card = container.firstElementChild!
    expect(card.className).toContain('glow-card--glow')
    expect(card.querySelector('.glow-card__glass')).not.toBeNull()
    expect(card.querySelector('.glow-card__glow')).not.toBeNull()
    expect(card.querySelector('.glow-card__line')).not.toBeNull()
    expect(card.innerHTML).not.toContain('feTurbulence')
  })

  it('el contenido tiene z-index alto para estar encima de los efectos', () => {
    const { container } = render(<GlowCard glow><p>Test</p></GlowCard>)
    const card = container.firstElementChild!
    const contentLayer = card.querySelector('.z-40')
    expect(contentLayer).not.toBeNull()
    expect(contentLayer?.textContent).toBe('Test')
  })
})
