import { describe, expect, it } from 'vitest'
import { flexBool } from './common'

describe('flexBool', () => {
  it('acepta booleanos y 0/1 (TINYINT de MySQL) y devuelve booleano', () => {
    const s = flexBool()
    expect(s.parse(true)).toBe(true)
    expect(s.parse(false)).toBe(false)
    expect(s.parse(1)).toBe(true)
    expect(s.parse(0)).toBe(false)
  })

  it('rechaza otros valores', () => {
    const s = flexBool()
    expect(s.safeParse(2).success).toBe(false)
    expect(s.safeParse('true').success).toBe(false)
  })
})
