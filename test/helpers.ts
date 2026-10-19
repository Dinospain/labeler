import { PrismaClient } from '@prisma/client'
import request from 'supertest'
import { createApp } from '../src/app'

export const prisma = new PrismaClient()

export const fakePdf = { calls: [] as { ids: number[]; size: string }[] }

export const app = createApp({
  prisma,
  pdfRenderer: async (opts) => {
    fakePdf.calls.push(opts)
    return Buffer.from('%PDF-fake')
  },
})

export async function resetDb() {
  await prisma.$executeRawUnsafe('TRUNCATE "Label","Template","Folder","Account" RESTART IDENTITY CASCADE')
  fakePdf.calls.length = 0
}

export const makeAccount = (slug: string, name = slug) => prisma.account.create({ data: { slug, name } })
export const makeFolder = (accountId: number, name = 'Папка') => prisma.folder.create({ data: { accountId, name } })
export const makeLabel = (accountId: number, data: Record<string, unknown> = {}) =>
  prisma.label.create({ data: { productName: 'Хлеб', accountId, ...data } })
export const makeTemplate = (accountId: number, data: Record<string, unknown> = {}) =>
  prisma.template.create({ data: { name: 'T', html: '<p/>', accountId, ...data } })

/** supertest-агент с заголовком X-Account */
export const as = (slug: string) => ({
  get: (url: string) => request(app).get(url).set('X-Account', slug),
  post: (url: string, body?: object) => request(app).post(url).set('X-Account', slug).send(body),
  put: (url: string, body?: object) => request(app).put(url).set('X-Account', slug).send(body),
  delete: (url: string) => request(app).delete(url).set('X-Account', slug),
})
export { request }
