import { describe, expect, it } from 'vitest'
import { autoBarcodeFor, ensureEan13, formatEanHuman } from './ean13'

describe('ensureEan13', () => {
  it('appends the check digit to 12 digits', () => {
    expect(ensureEan13('460123456789')).toBe('4601234567893')
    expect(ensureEan13('200000000001')).toBe('2000000000015')
  })
  it('strips non-digits', () => {
    expect(ensureEan13('4601-2345 6789')).toBe('4601234567893')
  })
  it('recomputes the check digit of a 13-digit input', () => {
    // pinned: current behaviour, wrong check digit is silently corrected
    expect(ensureEan13('4601234567890')).toBe('4601234567893')
    expect(ensureEan13('4601234567893')).toBe('4601234567893')
  })
  it('right-pads short input with zeros', () => {
    // pinned: current behaviour
    expect(ensureEan13('123')).toBe(ensureEan13('123000000000'))
    expect(ensureEan13('')).toBe('0000000000000')
    expect(ensureEan13(null)).toBe('0000000000000')
  })
})

describe('formatEanHuman', () => {
  it('splits into D XXXXXX XXXXXX', () => {
    expect(formatEanHuman('4601234567893')).toBe('4 601234 567893')
  })
})

describe('autoBarcodeFor', () => {
  it('builds 12 digits from the id', () => {
    expect(autoBarcodeFor(1)).toBe('200000000001')
    expect(autoBarcodeFor('42')).toBe('200000000042')
    expect(autoBarcodeFor(null)).toBe('200000000000')
  })
})
