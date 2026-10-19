import type { PrismaClient } from '@prisma/client'
import { notFound } from '../../http/errors'
import type { CreateTemplateInput, UpdateTemplateInput } from './templates.schema'

export function templatesService(prisma: PrismaClient) {
  async function getOwned(accountId: number, id: number) {
    const tpl = await prisma.template.findFirst({ where: { id, accountId } })
    if (!tpl) throw notFound()
    return tpl
  }

  return {
    list: (accountId: number) =>
      prisma.template.findMany({
        where: { accountId },
        orderBy: [{ isCurrent: 'desc' }, { updatedAt: 'desc' }],
      }),

    // не более одного isCurrent на аккаунт
    create: (accountId: number, input: CreateTemplateInput) =>
      prisma.$transaction(async (tx) => {
        if (input.isCurrent) await tx.template.updateMany({ where: { accountId }, data: { isCurrent: false } })
        return tx.template.create({ data: { ...input, accountId } })
      }),

    async update(accountId: number, id: number, input: UpdateTemplateInput) {
      await getOwned(accountId, id)
      return prisma.$transaction(async (tx) => {
        if (input.isCurrent === true) await tx.template.updateMany({ where: { accountId }, data: { isCurrent: false } })
        return tx.template.update({ where: { id }, data: input })
      })
    },

    makeCurrent: (accountId: number, id: number) => templatesService(prisma).update(accountId, id, { isCurrent: true }),
  }
}
