import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { app, makeAccount, makeLabel, prisma, resetDb } from './helpers'

beforeEach(resetDb)

describe('account resolution', () => {
  it.each(['/api/labels', '/api/folders', '/api/templates', '/api/print'])('%s → 401 without account', async (url) => {
    const res = await request(app).get(url)
    expect(res.status).toBe(401)
  })

  it('401 for an unknown account', async () => {
    expect((await request(app).get('/api/labels').set('X-Account', 'ghost')).status).toBe(401)
  })

  it('accepts header, query, cookie and numeric id', async () => {
    const acc = await makeAccount('a')
    await makeLabel(acc.id)
    const ok = async (r: request.Test) => expect((await r).body).toHaveLength(1)
    await ok(request(app).get('/api/labels').set('X-Account', 'a'))
    await ok(request(app).get('/api/labels?account=a'))
    await ok(request(app).get('/api/labels').set('Cookie', 'foo=1; X-Account=a'))
    await ok(request(app).get('/api/labels').set('X-Account', String(acc.id)))
  })
})

describe('error handling', () => {
  it('unknown /api route → JSON 404 (not the SPA)', async () => {
    const res = await request(app).get('/api/nope')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Not found' })
  })

  it('invalid JSON body → 400', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{bad')
    expect(res.status).toBe(400)
    expect(res.body.error).toBeTruthy()
  })

  it('database failure → JSON 500, request does not hang', async () => {
    const acc = await makeAccount('a')
    const spy = vi.spyOn(prisma.label, 'findMany').mockRejectedValueOnce(new Error('boom'))
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await request(app).get('/api/labels').set('X-Account', String(acc.id))
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Internal server error' })
    spy.mockRestore()
    quiet.mockRestore()
  })

  it('non-numeric :id → 400', async () => {
    await makeAccount('a')
    expect((await request(app).get('/api/labels/abc').set('X-Account', 'a')).status).toBe(400)
  })
})
