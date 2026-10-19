import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from './client'

const store = new Map<string, string>()

beforeEach(() => {
  store.clear()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })
})
afterEach(() => vi.unstubAllGlobals())

const reply = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status })

describe('request', () => {
  it('отправляет X-Account и JSON-тело', async () => {
    store.set('accountSlug', 'hlebzavod')
    const f = vi.fn().mockResolvedValue(reply(200, { id: 1 }))
    vi.stubGlobal('fetch', f)
    await expect(request('/api/folders', { method: 'POST', body: { name: 'A' } })).resolves.toEqual({ id: 1 })
    const [path, init] = f.mock.calls[0]
    expect(path).toBe('/api/folders')
    expect(init.method).toBe('POST')
    expect(init.headers['X-Account']).toBe('hlebzavod')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(init.body).toBe('{"name":"A"}')
  })

  it('без аккаунта заголовок не ставится', async () => {
    const f = vi.fn().mockResolvedValue(reply(200, []))
    vi.stubGlobal('fetch', f)
    await request('/api/labels')
    expect(f.mock.calls[0][1].headers['X-Account']).toBeUndefined()
  })

  it('204 → undefined', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(204)))
    await expect(request('/api/labels/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('берёт текст ошибки из {error}', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(400, { error: 'productName is required' })))
    await expect(request('/api/labels')).rejects.toThrow('productName is required')
  })

  it('не-JSON ошибка → HTTP <status>', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('boom', { status: 502 })))
    await expect(request('/api/labels')).rejects.toThrow('HTTP 502')
  })

  it('сетевая ошибка → Error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(request('/api/labels')).rejects.toThrow('Failed to fetch')
  })
})
