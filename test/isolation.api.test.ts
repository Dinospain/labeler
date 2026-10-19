import { beforeEach, describe, expect, it } from 'vitest'
import { as, makeAccount, makeFolder, makeLabel, makeTemplate, prisma, resetDb } from './helpers'

// Аккаунт B не должен видеть и менять данные аккаунта A
let aLabel: { id: number }
let aFolder: { id: number }
let aTemplate: { id: number }
beforeEach(async () => {
  await resetDb()
  const a = await makeAccount('a')
  await makeAccount('b')
  aLabel = await makeLabel(a.id)
  aFolder = await makeFolder(a.id)
  aTemplate = await makeTemplate(a.id)
})

describe('tenant isolation (B → A)', () => {
  it('labels: get/put/delete → 404, list is empty', async () => {
    expect((await as('b').get(`/api/labels/${aLabel.id}`)).status).toBe(404)
    expect((await as('b').put(`/api/labels/${aLabel.id}`, { productName: 'x' })).status).toBe(404)
    expect((await as('b').delete(`/api/labels/${aLabel.id}`)).status).toBe(404)
    expect((await as('b').get('/api/labels')).body).toEqual([])
    expect(await prisma.label.count()).toBe(1)
  })

  it('labels: cannot attach to a foreign folder (create and update)', async () => {
    expect((await as('b').post('/api/labels', { productName: 'x', folderId: aFolder.id })).status).toBe(400)
    const own = (await as('b').post('/api/labels', { productName: 'x' })).body
    expect((await as('b').put(`/api/labels/${own.id}`, { folderId: aFolder.id })).status).toBe(400)
  })

  it('folders: put/delete → 404, list is empty', async () => {
    expect((await as('b').put(`/api/folders/${aFolder.id}`, { name: 'x' })).status).toBe(404)
    expect((await as('b').delete(`/api/folders/${aFolder.id}`)).status).toBe(404)
    expect((await as('b').get('/api/folders')).body).toEqual([])
  })

  it('templates: put/make-current → 404, list is empty', async () => {
    expect((await as('b').put(`/api/templates/${aTemplate.id}`, { name: 'x' })).status).toBe(404)
    expect((await as('b').put(`/api/templates/${aTemplate.id}/make-current`)).status).toBe(404)
    expect((await as('b').get('/api/templates')).body).toEqual([])
  })

  it('print: foreign ids → 404', async () => {
    expect((await as('b').get(`/api/print?ids=${aLabel.id}`)).status).toBe(404)
  })
})
