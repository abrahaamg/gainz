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

  it('tiene las capas internas (glass, glow, noise)', () => {
    const { container } = render(<GlowCard><p>Test</p></GlowCard>)
    const card = container.firstElementChild!
    // Debe tener múltiples divs hijos (capas de efecto + contenido)
    expect(card.children.length).toBeGreaterThanOrEqual(6)
  })

  it('el contenido tiene z-index alto para estar encima de los efectos', () => {
    const { container } = render(<GlowCard><p>Test</p></GlowCard>)
    const card = container.firstElementChild!
    const contentLayer = card.querySelector('.z-40')
    expect(contentLayer).not.toBeNull()
    expect(contentLayer?.textContent).toBe('Test')
  })
})
