import { describe, expect, it } from 'vitest'
import { printUrl } from './printUrl'

describe('printUrl', () => {
  it('содержит ids, size и account', () => {
    expect(printUrl(7, '58x40', 'hlebzavod')).toBe('/api/print?ids=7&size=58x40&account=hlebzavod')
  })
  it('без аккаунта параметр не добавляется', () => {
    expect(printUrl(7, '100x70', null)).toBe('/api/print?ids=7&size=100x70')
  })
})
