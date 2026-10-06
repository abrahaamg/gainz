import { describe, it, expect } from 'vitest'
import { canHide, markHidden, splitHidden } from './hiddenRoutines'
import type { Routine } from '../types/routine'

const routine = (id: number, user_id: number, is_hidden = false) =>
  ({ id, user_id, name: `R${id}`, is_hidden }) as Routine

describe('canHide', () => {
  it('permite ocultar rutinas de otro usuario', () => {
    expect(canHide(routine(1, 1), 7)).toBe(true)
  })

  it('no permite ocultar las propias', () => {
    expect(canHide(routine(1, 7), 7)).toBe(false)
  })

  it('sin usuario cargado no ofrece ocultar', () => {
    expect(canHide(routine(1, 1), undefined)).toBe(false)
  })
})

describe('splitHidden', () => {
  it('separa visibles y ocultas conservando el orden', () => {
    const { visible, hidden } = splitHidden([routine(1, 1, true), routine(2, 7), routine(3, 1), routine(4, 1, true)])
    expect(visible.map(r => r.id)).toEqual([2, 3])
    expect(hidden.map(r => r.id)).toEqual([1, 4])
  })
})

describe('markHidden', () => {
  it('marca solo la rutina indicada sin mutar la lista', () => {
    const list = [routine(1, 1), routine(2, 1)]
    const result = markHidden(list, 2, true)
    expect(result.map(r => r.is_hidden)).toEqual([false, true])
    expect(list[1].is_hidden).toBe(false)
  })

  it('la vuelve a mostrar', () => {
    expect(markHidden([routine(1, 1, true)], 1, false)[0].is_hidden).toBe(false)
  })
})
