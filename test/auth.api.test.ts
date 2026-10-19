import { beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app, makeAccount, resetDb } from './helpers'

beforeEach(resetDb)

describe('auth', () => {
  it('lists accounts sorted by name without needing an account', async () => {
    await makeAccount('b', 'Б')
    await makeAccount('a', 'А')
    const res = await request(app).get('/api/auth/accounts')
    expect(res.status).toBe(200)
    expect(res.body.map((a: any) => a.slug)).toEqual(['a', 'b'])
  })

  it('logs in by slug', async () => {
    await makeAccount('a', 'А')
    const res = await request(app).post('/api/auth/login').send({ slug: 'a' })
    expect(res.status).toBe(200)
    expect(res.body.account).toMatchObject({ slug: 'a', name: 'А' })
  })

  it('400 on empty slug, 404 on unknown', async () => {
    expect((await request(app).post('/api/auth/login').send({ slug: '  ' })).status).toBe(400)
    expect((await request(app).post('/api/auth/login').send({})).status).toBe(400)
    expect((await request(app).post('/api/auth/login').send({ slug: 'nope' })).status).toBe(404)
  })
})
