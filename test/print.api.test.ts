import { beforeEach, describe, expect, it } from 'vitest'
import { as, fakePdf, makeAccount, makeLabel, resetDb } from './helpers'

let a: { id: number }
let b: { id: number }
beforeEach(async () => {
  await resetDb()
  a = await makeAccount('a')
  b = await makeAccount('b')
})

describe('print', () => {
  it('prints requested ids in order, only own, default size 100x70', async () => {
    const l1 = await makeLabel(a.id)
    const l2 = await makeLabel(a.id)
    const foreign = await makeLabel(b.id)
    const res = await as('a').get(`/api/print?ids=${l2.id},${l1.id},${foreign.id}`)
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toBe('application/pdf')
    expect(fakePdf.calls).toEqual([{ ids: [l1.id, l2.id], size: '100x70' }])
  })

  it('prints all own labels when ids are omitted, passes size', async () => {
    const l1 = await makeLabel(a.id)
    await makeLabel(b.id)
    await as('a').get('/api/print?size=58x40')
    expect(fakePdf.calls).toEqual([{ ids: [l1.id], size: '58x40' }])
  })

  it('404 when nothing to print', async () => {
    const foreign = await makeLabel(b.id)
    expect((await as('a').get('/api/print')).status).toBe(404)
    expect((await as('a').get(`/api/print?ids=${foreign.id}`)).status).toBe(404)
    expect(fakePdf.calls).toEqual([])
  })
})
