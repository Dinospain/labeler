import { beforeEach, describe, expect, it } from 'vitest'
import { as, makeAccount, makeFolder, makeLabel, resetDb } from './helpers'

let a: { id: number }
beforeEach(async () => {
  await resetDb()
  a = await makeAccount('a')
})

describe('labels CRUD', () => {
  it('creates a minimal label', async () => {
    const res = await as('a').post('/api/labels', { productName: '  Хлеб ' })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ productName: 'Хлеб', accountId: a.id, folderId: null, barcodeType: 'ean13' })
  })

  it('creates a full label with coerced values', async () => {
    const folder = await makeFolder(a.id)
    const res = await as('a').post('/api/labels', {
      productName: 'Торт', weight: '500 г', proteins100g: '5,5', fats100g: 10, carbs100g: '',
      manufacturedAt: '2024-03-01', expiresAt: '2024-03-10', barcode: '460123456789', folderId: String(folder.id),
      address: 'ул. Мира', mchsInfo: 'МЧС', website: 'x.by',
    })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      proteins100g: 5.5, fats100g: 10, carbs100g: null, folderId: folder.id,
      address: 'ул. Мира', mchsInfo: 'МЧС', website: 'x.by', barcode: '460123456789',
    })
    expect(res.body.manufacturedAt).toBe('2024-03-01T00:00:00.000Z')
  })

  it.each([
    [{}, 'productName'],
    [{ productName: '   ' }, 'productName'],
    [{ productName: 'x', proteins100g: 'abc' }, 'proteins100g'],
    [{ productName: 'x', expiresAt: 'not-a-date' }, 'expiresAt'],
    [{ productName: 'x', barcode: '12345' }, 'barcode'],
    [{ productName: 'x', barcode: '4601234567890' }, 'barcode'],
  ])('rejects invalid body %j with 400', async (body, field) => {
    const res = await as('a').post('/api/labels', body)
    expect(res.status).toBe(400)
    expect(res.body.error).toContain(field)
  })

  it('accepts a 13-digit barcode with a valid check digit', async () => {
    const res = await as('a').post('/api/labels', { productName: 'x', barcode: '4601234567893' })
    expect(res.status).toBe(201)
  })

  it('PUT with a partial body does not clobber other fields', async () => {
    const label = await makeLabel(a.id, { weight: '1 кг', address: 'адрес', expiresAt: new Date('2024-05-05') })
    const res = await as('a').put(`/api/labels/${label.id}`, { productName: 'Новый' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ productName: 'Новый', weight: '1 кг', address: 'адрес' })
    expect(res.body.expiresAt).toBe('2024-05-05T00:00:00.000Z')
  })

  it('PUT with explicit null clears a field', async () => {
    const label = await makeLabel(a.id, { weight: '1 кг' })
    const res = await as('a').put(`/api/labels/${label.id}`, { weight: null })
    expect(res.body.weight).toBeNull()
  })

  it('GET one, then DELETE → 204 then 404', async () => {
    const label = await makeLabel(a.id)
    expect((await as('a').get(`/api/labels/${label.id}`)).status).toBe(200)
    expect((await as('a').delete(`/api/labels/${label.id}`)).status).toBe(204)
    expect((await as('a').get(`/api/labels/${label.id}`)).status).toBe(404)
    expect((await as('a').delete(`/api/labels/${label.id}`)).status).toBe(404)
  })

  it('lists newest-updated first', async () => {
    const l1 = await makeLabel(a.id, { productName: 'old' })
    const l2 = await makeLabel(a.id, { productName: 'new' })
    await as('a').put(`/api/labels/${l1.id}`, { productName: 'old2' })
    const res = await as('a').get('/api/labels')
    expect(res.body.map((l: any) => l.id)).toEqual([l1.id, l2.id])
  })
})
