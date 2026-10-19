import type { PrismaClient } from '@prisma/client'
import { notFound } from '../../http/errors'

export function foldersService(prisma: PrismaClient) {
  async function getOwned(accountId: number, id: number) {
    const folder = await prisma.folder.findFirst({ where: { id, accountId } })
    if (!folder) throw notFound()
    return folder
  }

  return {
    list: (accountId: number) =>
      prisma.folder.findMany({
        where: { accountId },
        orderBy: { name: 'asc' },
        include: { _count: { select: { labels: true } } },
      }),
    create: (accountId: number, name: string) => prisma.folder.create({ data: { name, accountId } }),
    async rename(accountId: number, id: number, name: string) {
      await getOwned(accountId, id)
      return prisma.folder.update({ where: { id }, data: { name } })
    },
    async remove(accountId: number, id: number) {
      await getOwned(accountId, id)
      await prisma.folder.delete({ where: { id } })
    },
  }
}
