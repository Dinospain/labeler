import { describe, expect, it } from 'vitest'
import { calcEnergy, calcEnergyText, formatDate } from './format'

describe('formatDate', () => {
  it('formats Date and local-time strings as DD.MM.YYYY', () => {
    expect(formatDate(new Date(2024, 0, 5))).toBe('05.01.2024')
    expect(formatDate('2024-03-09T12:00:00')).toBe('09.03.2024')
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
