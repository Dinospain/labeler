import type { PrismaClient } from '@prisma/client'
import { badRequest, notFound } from '../../http/errors'
import type { CreateLabelInput, UpdateLabelInput } from './labels.schema'

export function labelsService(prisma: PrismaClient) {
  async function getOwned(accountId: number, id: number) {
    const label = await prisma.label.findFirst({ where: { id, accountId } })
    if (!label) throw notFound()
    return label
  }

  // папка должна принадлежать тому же аккаунту
  async function assertFolder(accountId: number, folderId: number | null | undefined) {
    if (folderId == null) return
    const folder = await prisma.folder.findFirst({ where: { id: folderId, accountId } })
    if (!folder) throw badRequest('Invalid folderId for this account')
  }

  return {
    list: (accountId: number) => prisma.label.findMany({ where: { accountId }, orderBy: { updatedAt: 'desc' } }),
    get: getOwned,

    async create(accountId: number, input: CreateLabelInput) {
      await assertFolder(accountId, input.folderId)
      return prisma.label.create({ data: { ...input, barcodeType: 'ean13', accountId } })
    },

    async update(accountId: number, id: number, input: UpdateLabelInput) {
      await getOwned(accountId, id)
      await assertFolder(accountId, input.folderId)
      return prisma.label.update({ where: { id }, data: input })
    },

    async remove(accountId: number, id: number) {
      await getOwned(accountId, id)
      await prisma.label.delete({ where: { id } })
    },

    /** id принадлежащих аккаунту этикеток (по порядку id) */
    async idsFor(accountId: number, ids?: number[]) {
      const rows = await prisma.label.findMany({
        where: { accountId, ...(ids?.length ? { id: { in: ids } } : {}) },
        select: { id: true },
        orderBy: { id: 'asc' },
      })
      return rows.map((r) => r.id)
    },
  }
}
