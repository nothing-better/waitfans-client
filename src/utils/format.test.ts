import { describe, expect, it } from 'vitest'
import { handleLevel, handleNum, handleTime } from './format'

describe('format helpers', () => {
  it('formats video durations', () => {
    expect(handleTime(65)).toBe('01:05')
    expect(handleTime(3661)).toBe('01:01:01')
  })

  it('uses compact Chinese number units', () => {
    expect(handleNum(9999)).toBe('9999')
    expect(handleNum(12_000)).toBe('1.2万')
    expect(handleNum(230_000_000)).toBe('2.3亿')
  })

  it('maps experience points to levels', () => {
    expect(handleLevel(0)).toBe(0)
    expect(handleLevel(1500)).toBe(3)
    expect(handleLevel(30_000)).toBe(6)
  })
})
