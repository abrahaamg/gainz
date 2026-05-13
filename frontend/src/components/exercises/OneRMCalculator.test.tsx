import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OneRMCalculator from './OneRMCalculator'

describe('OneRMCalculator', () => {
  it('renderiza el título', () => {
    render(<OneRMCalculator />)
    expect(screen.getByText('Calculadora 1RM')).toBeInTheDocument()
  })

  it('tiene inputs de peso y repeticiones', () => {
    render(<OneRMCalculator />)
    expect(screen.getByPlaceholderText('ej. 80')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('ej. 8')).toBeInTheDocument()
  })

  it('no muestra resultado sin datos', () => {
    render(<OneRMCalculator />)
    expect(screen.queryByText('1RM estimado')).not.toBeInTheDocument()
  })

  it('calcula y muestra el 1RM al introducir datos válidos', async () => {
    const user = userEvent.setup()
    render(<OneRMCalculator />)

    await user.type(screen.getByPlaceholderText('ej. 80'), '80')
    await user.type(screen.getByPlaceholderText('ej. 8'), '5')

    // 80 * (1 + 5/30) = 93.3 — aparece en el resultado y en la tabla
    expect(screen.getByText('1RM estimado')).toBeInTheDocument()
    expect(screen.getAllByText('93.3').length).toBeGreaterThanOrEqual(1)
  })

  it('muestra la tabla de porcentajes', async () => {
    const user = userEvent.setup()
    render(<OneRMCalculator />)

    await user.type(screen.getByPlaceholderText('ej. 80'), '100')
    await user.type(screen.getByPlaceholderText('ej. 8'), '1')

    // Con 1RM = 100, debería mostrar las filas de porcentaje
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('muestra mensaje de error con valores inválidos', async () => {
    const user = userEvent.setup()
    render(<OneRMCalculator />)

    await user.type(screen.getByPlaceholderText('ej. 80'), '0')
    await user.type(screen.getByPlaceholderText('ej. 8'), '0')

    expect(screen.getByText(/valores inválidos/i)).toBeInTheDocument()
  })
})
