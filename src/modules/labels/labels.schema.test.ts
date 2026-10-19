import { describe, expect, it } from 'vitest'
import { createLabelSchema, updateLabelSchema } from './labels.schema'

describe('labels schema', () => {
  it('coerces numbers (comma, strings, empty → null)', () => {
    const r = createLabelSchema.parse({ productName: 'x', proteins100g: '1,5', fats100g: 2, carbs100g: '' })
    expect(r).toMatchObject({ proteins100g: 1.5, fats100g: 2, carbs100g: null })
    expect(() => createLabelSchema.parse({ productName: 'x', proteins100g: 'abc' })).toThrow()
  })
  it('parses dates and rejects garbage', () => {
    expect(createLabelSchema.parse({ productName: 'x', expiresAt: '2024-01-02' }).expiresAt).toEqual(new Date('2024-01-02'))
    expect(createLabelSchema.parse({ productName: 'x', expiresAt: '' }).expiresAt).toBeNull()
    expect(() => createLabelSchema.parse({ productName: 'x', expiresAt: 'zzz' })).toThrow()
  })
  it('folderId variants', () => {
    const f = (folderId: unknown) => createLabelSchema.parse({ productName: 'x', folderId }).folderId
    expect(f('3')).toBe(3)
    expect(f(3)).toBe(3)
    expect(f('')).toBeNull()
    expect(f(null)).toBeNull()
    expect(f(undefined)).toBeUndefined()
    expect(() => f('abc')).toThrow()
  })
  it('validates barcode', () => {
    const b = (barcode: unknown) => createLabelSchema.parse({ productName: 'x', barcode }).barcode
    expect(b('460123456789')).toBe('460123456789')
    expect(b('4601234567893')).toBe('4601234567893')
    expect(b('')).toBeNull()
    expect(() => b('4601234567890')).toThrow()
    expect(() => b('123')).toThrow()
    expect(() => b('46012345678a')).toThrow()
  })
  it('update: omitted = undefined (unchanged), explicit null = clear', () => {
    const r = updateLabelSchema.parse({ weight: null })
    expect(r.weight).toBeNull()
    expect('productName' in r).toBe(false)
    expect('address' in r).toBe(false)
    expect(() => updateLabelSchema.parse({ productName: ' ' })).toThrow()
  })
})
