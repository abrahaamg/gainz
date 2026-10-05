import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from './Modal'

describe('Modal', () => {
  it('no renderiza nada si está cerrado', () => {
    render(<Modal open={false} onClose={() => {}} labelledBy="t"><h2 id="t">Título</h2></Modal>)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('expone role dialog, aria-modal y título accesible', () => {
    render(<Modal open onClose={() => {}} labelledBy="t"><h2 id="t">Título</h2><button>Ok</button></Modal>)
    const dialog = screen.getByRole('dialog', { name: 'Título' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('mueve el foco al primer elemento y cierra con Escape', async () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose} labelledBy="t"><h2 id="t">T</h2><button>Uno</button><button>Dos</button></Modal>)
    expect(screen.getByText('Uno')).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('atrapa el foco con Tab y Shift+Tab', async () => {
    render(<Modal open onClose={() => {}} labelledBy="t"><h2 id="t">T</h2><button>Uno</button><button>Dos</button></Modal>)
    await userEvent.tab()
    expect(screen.getByText('Dos')).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByText('Uno')).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(screen.getByText('Dos')).toHaveFocus()
  })
})
