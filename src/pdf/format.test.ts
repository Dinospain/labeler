import { describe, expect, it } from 'vitest'
import { calcEnergy, calcEnergyText, formatDate } from './format'

describe('formatDate', () => {
  it('formats Date and ISO strings as DD.MM.YYYY', () => {
    expect(formatDate(new Date(Date.UTC(2024, 0, 5)))).toBe('05.01.2024')
    expect(formatDate('2024-03-09T12:00:00Z')).toBe('09.03.2024')
  })
  it('formats in UTC regardless of server TZ (B12)', () => {
    const prev = process.env.TZ
    try {
      for (const tz of ['America/New_York', 'Pacific/Auckland']) {
        process.env.TZ = tz
        expect(formatDate('2024-03-09T00:00:00.000Z')).toBe('09.03.2024')
        expect(formatDate(new Date('2024-12-31T23:59:59Z'))).toBe('31.12.2024')
      }
    } finally {
      if (prev === undefined) delete process.env.TZ
      else process.env.TZ = prev
    }
  })
  it('returns undefined for empty or invalid input', () => {
    expect(formatDate(null)).toBeUndefined()
    expect(formatDate(undefined)).toBeUndefined()
    expect(formatDate('')).toBeUndefined()
    expect(formatDate('nope')).toBeUndefined()
  })
})

describe('calcEnergy', () => {
  it('uses 4/9/4 kcal and kcal * 4.184 kJ', () => {
    // pinned: current behaviour
    expect(calcEnergy(10, 5, 20)).toEqual({ kcal: 165, kJ: 690 })
  })
  it('treats null/undefined as zero', () => {
    expect(calcEnergy(null, undefined, null)).toEqual({ kcal: 0, kJ: 0 })
  })
  it('rounds decimals', () => {
    expect(calcEnergy(1.1, 0.5, 0.3)).toEqual({ kcal: 10, kJ: 42 })
  })
  it('builds the text', () => {
    expect(calcEnergyText(10, 5, 20)).toBe('165 ккал / 690 кДж')
  })
})
