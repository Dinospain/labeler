// Создание предприятия: npm run create-account -- "<Название>" <slug>
import { prisma } from '../src/prisma/client'

async function main() {
    const [name, slug] = process.argv.slice(2)
    if (!name || !slug) {
        console.log('Usage: npm run create-account -- "<Name>" <slug>')
        process.exit(1)
    }
    const account = await prisma.account.create({
        data: { name, slug },
        select: { id: true, name: true, slug: true },
    })
    console.log('Created account:', account)
}

main()
    .catch((e) => { console.error(e); process.exitCode = 1 })
    .finally(() => prisma.$disconnect())
