import { describe, it, expect } from 'vitest'
import { fmtTime, fmtDuration } from './time'

describe('fmtTime', () => {
  it('formatea mm:ss con ceros', () => {
    expect(fmtTime(0)).toBe('00:00')
    expect(fmtTime(65)).toBe('01:05')
    expect(fmtTime(3725)).toBe('62:05')
  })
  it('no devuelve negativos', () => {
    expect(fmtTime(-5)).toBe('00:00')
  })
})

describe('fmtDuration', () => {
  it('muestra minutos y segundos por debajo de la hora', () => {
    expect(fmtDuration(750)).toBe('12m 30s')
  })
  it('muestra horas y minutos desde la hora', () => {
    expect(fmtDuration(3900)).toBe('1h 5m')
  })
})
