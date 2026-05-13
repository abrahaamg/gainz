import { describe, it, expect } from 'vitest'
import {
  AppError,
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from './customErrors'

describe('Custom Errors', () => {
  it('AppError tiene statusCode y mensaje', () => {
    const err = new AppError('test error', 500)
    expect(err.message).toBe('test error')
    expect(err.statusCode).toBe(500)
    expect(err.isOperational).toBe(true)
    expect(err).toBeInstanceOf(Error)
  })

  it('NotFoundError tiene status 404', () => {
    const err = new NotFoundError('Ejercicio')
    expect(err.statusCode).toBe(404)
    expect(err.message).toContain('Ejercicio')
    expect(err.message).toContain('not found')
  })

  it('NotFoundError sin argumento usa "Resource"', () => {
    const err = new NotFoundError()
    expect(err.message).toBe('Resource not found')
  })

  it('BadRequestError tiene status 400', () => {
    const err = new BadRequestError('Falta campo')
    expect(err.statusCode).toBe(400)
    expect(err.message).toBe('Falta campo')
  })

  it('UnauthorizedError tiene status 401', () => {
    const err = new UnauthorizedError()
    expect(err.statusCode).toBe(401)
    expect(err.message).toBe('Unauthorized')
  })

  it('ForbiddenError tiene status 403', () => {
    const err = new ForbiddenError()
    expect(err.statusCode).toBe(403)
  })

  it('ConflictError tiene status 409', () => {
    const err = new ConflictError('Ya existe')
    expect(err.statusCode).toBe(409)
    expect(err.message).toBe('Ya existe')
  })
})
