import { beforeEach, describe, expect, it } from 'vitest'
import { as, makeAccount, makeFolder, makeLabel, prisma, resetDb } from './helpers'

let a: { id: number }
beforeEach(async () => {
  await resetDb()
  a = await makeAccount('a')
})

describe('folders', () => {
  it('create, rename, list with _count sorted by name', async () => {
    const created = await as('a').post('/api/folders', { name: ' Б ' })
    expect(created.status).toBe(201)
    expect(created.body.name).toBe('Б')
    const other = await makeFolder(a.id, 'А')
    await makeLabel(a.id, { folderId: other.id })

    const renamed = await as('a').put(`/api/folders/${created.body.id}`, { name: 'В' })
    expect(renamed.body.name).toBe('В')

    const list = await as('a').get('/api/folders')
    expect(list.body.map((f: any) => [f.name, f._count.labels])).toEqual([['А', 1], ['В', 0]])
  })

  it('400 on empty name', async () => {
    expect((await as('a').post('/api/folders', { name: '  ' })).status).toBe(400)
    const f = await makeFolder(a.id)
    expect((await as('a').put(`/api/folders/${f.id}`, {})).status).toBe(400)
  })

  it('deleting a folder with labels keeps the labels and nulls folderId', async () => {
    const f = await makeFolder(a.id)
    const l = await makeLabel(a.id, { folderId: f.id })
    expect((await as('a').delete(`/api/folders/${f.id}`)).status).toBe(204)
    expect((await prisma.label.findUnique({ where: { id: l.id } }))!.folderId).toBeNull()
    expect((await as('a').delete(`/api/folders/${f.id}`)).status).toBe(404)
  })
})
