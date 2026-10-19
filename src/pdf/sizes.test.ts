import { describe, expect, it } from 'vitest'
import { LABEL_SIZES, parseSize } from './sizes'

describe('parseSize', () => {
  it('parses known sizes case-insensitively', () => {
    expect(parseSize('58x40')).toBe('58x40')
    expect(parseSize('100X70')).toBe('100x70')
    expect(parseSize('10x7')).toBe('100x70')
  })
  it('returns null for unknown or empty', () => {
    expect(parseSize('a4')).toBeNull()
    expect(parseSize('')).toBeNull()
    expect(parseSize(undefined)).toBeNull()
  })
  it('has pdf options for every key', () => {
    expect(LABEL_SIZES['58x40']).toMatchObject({ width: '58mm', height: '40mm' })
    expect(LABEL_SIZES['100x70']).toMatchObject({ width: '100mm', height: '70mm' })
    expect(LABEL_SIZES.a4).toMatchObject({ format: 'A4' })
  })
})
