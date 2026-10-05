import { describe, it, expect } from 'vitest'
import { AxiosError, type AxiosResponse } from 'axios'
import { apiErrorMessage } from './apiError'

function axiosError(status: number, data: unknown) {
  const err = new AxiosError('Request failed')
  err.response = { status, data } as AxiosResponse
  return err
}

describe('apiErrorMessage', () => {
  it('lee message en errores 4xx con forma { status, message }', () => {
    const err = axiosError(400, { status: 400, message: 'Nombre duplicado' })
    expect(apiErrorMessage(err, 'fallback')).toBe('Nombre duplicado')
  })

  it('usa el fallback en errores 5xx', () => {
    const err = axiosError(500, { status: 500, message: 'Internal error' })
    expect(apiErrorMessage(err, 'fallback')).toBe('fallback')
  })

  it('usa el fallback si no hay message o no es un error de axios', () => {
    expect(apiErrorMessage(axiosError(404, {}), 'fallback')).toBe('fallback')
    expect(apiErrorMessage(new Error('x'), 'fallback')).toBe('fallback')
  })
})
