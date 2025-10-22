// scripts/purge-default.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const acc = await prisma.account.findUnique({ where: { slug: 'default' } })
    if (!acc) {
        console.log('No default account found. Nothing to purge.')
        return
    }

    console.log('Purging data for account "default" (id=', acc.id, ')')

    await prisma.$transaction(async (tx) => {
        await tx.template.deleteMany({ where: { accountId: acc.id } })
        await tx.label.deleteMany({ where: { accountId: acc.id } })
        await tx.folder.deleteMany({ where: { accountId: acc.id } })
        await tx.account.delete({ where: { id: acc.id } })
    })

    console.log('✅ Purged default account and related data')
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
}).finally(async () => {
    await prisma.$disconnect()
})
