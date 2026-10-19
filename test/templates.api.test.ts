import { beforeEach, describe, expect, it } from 'vitest'
import { as, makeAccount, makeTemplate, prisma, resetDb } from './helpers'

let a: { id: number }
let b: { id: number }
beforeEach(async () => {
  await resetDb()
  a = await makeAccount('a')
  b = await makeAccount('b')
})

describe('templates', () => {
  it('creates a template for the current account', async () => {
    const res = await as('a').post('/api/templates', { name: 'T', html: '<p>{{x}}</p>' })
    expect(res.status).toBe(201)
    expect(res.body.accountId).toBe(a.id)
  })

  it('400 on invalid body', async () => {
    expect((await as('a').post('/api/templates', { name: '', html: 'x' })).status).toBe(400)
  })

  it('keeps a single isCurrent per account and does not touch other tenants', async () => {
    const bTpl = await makeTemplate(b.id, { isCurrent: true })
    const t1 = (await as('a').post('/api/templates', { name: '1', html: 'x', isCurrent: true })).body
    const t2 = (await as('a').post('/api/templates', { name: '2', html: 'x', isCurrent: true })).body
    expect((await prisma.template.findUnique({ where: { id: t1.id } }))!.isCurrent).toBe(false)
    expect((await prisma.template.findUnique({ where: { id: t2.id } }))!.isCurrent).toBe(true)

    const res = await as('a').put(`/api/templates/${t1.id}/make-current`)
    expect(res.body.isCurrent).toBe(true)
    expect((await prisma.template.findUnique({ where: { id: t2.id } }))!.isCurrent).toBe(false)
    expect((await prisma.template.findUnique({ where: { id: bTpl.id } }))!.isCurrent).toBe(true)
  })

  it('lists only own templates, current first', async () => {
    await makeTemplate(b.id)
    await makeTemplate(a.id, { name: 'plain' })
    await makeTemplate(a.id, { name: 'cur', isCurrent: true })
    const res = await as('a').get('/api/templates')
    expect(res.body.map((t: any) => t.name)).toEqual(['cur', 'plain'])
  })
})
