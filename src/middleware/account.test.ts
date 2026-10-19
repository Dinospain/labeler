import { describe, expect, it } from 'vitest'
import { readAccountRef } from './account'

const req = (headers: Record<string, string> = {}, query: Record<string, string> = {}) => ({ headers, query }) as any

describe('readAccountRef', () => {
  it('prefers header over query over cookie', () => {
    const headers = { 'x-account': 'h', cookie: 'X-Account=c' }
    expect(readAccountRef(req(headers, { account: 'q' }))).toBe('h')
    expect(readAccountRef(req({ cookie: 'X-Account=c' }, { account: 'q' }))).toBe('q')
    expect(readAccountRef(req({ cookie: 'a=1; X-Account=c' }))).toBe('c')
  })
  it('returns empty string when nothing is given', () => {
    expect(readAccountRef(req())).toBe('')
  })
  it('keeps "=" inside a cookie value', () => {
    expect(readAccountRef(req({ cookie: 'X-Account=a=b' }))).toBe('a=b')
  })
  it('trims and supports numeric ids as strings', () => {
    expect(readAccountRef(req({ 'x-account': ' 12 ' }))).toBe('12')
  })
})
