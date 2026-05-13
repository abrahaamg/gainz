import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DifficultyDots from './DifficultyDots'

describe('DifficultyDots', () => {
  it('renderiza 3 puntos', () => {
    const { container } = render(<DifficultyDots level="medium" />)
    const dots = container.querySelectorAll('span')
    expect(dots).toHaveLength(3)
  })

  it('muestra 1 punto verde para easy', () => {
    const { container } = render(<DifficultyDots level="easy" />)
    const dots = container.querySelectorAll('span')
    expect(dots[0].className).toContain('bg-emerald-400')
    expect(dots[1].className).toContain('bg-neutral-200')
    expect(dots[2].className).toContain('bg-neutral-200')
  })

  it('muestra 1 punto verde para beginner', () => {
    const { container } = render(<DifficultyDots level="beginner" />)
    const dots = container.querySelectorAll('span')
    expect(dots[0].className).toContain('bg-emerald-400')
    expect(dots[1].className).toContain('bg-neutral-200')
  })

  it('muestra 2 puntos ámbar para medium', () => {
    const { container } = render(<DifficultyDots level="medium" />)
    const dots = container.querySelectorAll('span')
    expect(dots[0].className).toContain('bg-amber-400')
    expect(dots[1].className).toContain('bg-amber-400')
    expect(dots[2].className).toContain('bg-neutral-200')
  })

  it('muestra 2 puntos ámbar para intermediate', () => {
    const { container } = render(<DifficultyDots level="intermediate" />)
    const dots = container.querySelectorAll('span')
    expect(dots[0].className).toContain('bg-amber-400')
    expect(dots[1].className).toContain('bg-amber-400')
  })

  it('muestra 3 puntos rojos para hard', () => {
    const { container } = render(<DifficultyDots level="hard" />)
    const dots = container.querySelectorAll('span')
    expect(dots[0].className).toContain('bg-red-400')
    expect(dots[1].className).toContain('bg-red-400')
    expect(dots[2].className).toContain('bg-red-400')
  })
})
