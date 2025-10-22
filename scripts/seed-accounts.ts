// scripts/seed-accounts.ts
import { PrismaClient, Prisma } from '@prisma/client'
const prisma = new PrismaClient()

async function findOrCreateFolder(accountId: number, name: string) {
    const existed = await prisma.folder.findFirst({ where: { accountId, name } })
    if (existed) return existed
    return prisma.folder.create({ data: { name, accountId } })
}

async function main() {
    // 1) Аккаунты
    const hleb = await prisma.account.upsert({
        where: { slug: 'hlebzavod' },
        update: { name: 'Хлебозавод' },
        create: { name: 'Хлебозавод', slug: 'hlebzavod' },
    })
    const rest = await prisma.account.upsert({
        where: { slug: 'restaurant' },
        update: { name: 'Ресторан' },
        create: { name: 'Ресторан', slug: 'restaurant' },
    })

    // 2) Папки (find-or-create)
    const f_got_prod = await findOrCreateFolder(hleb.id, 'Готовая продукция')
    const f_polu = await findOrCreateFolder(hleb.id, 'Полуфабрикаты')
    const f_menu = await findOrCreateFolder(rest.id, 'Меню')
    const f_deserts = await findOrCreateFolder(rest.id, 'Десерты')

    // 3) Соберём список уже существующих названий, чтобы не дублировать
    const existsHleb = await prisma.label.findMany({
        where: { accountId: hleb.id },
        select: { productName: true },
    })
    const setHleb = new Set(existsHleb.map(x => x.productName))

    const existsRest = await prisma.label.findMany({
        where: { accountId: rest.id },
        select: { productName: true },
    })
    const setRest = new Set(existsRest.map(x => x.productName))

    // 4) Подготовим к вставке (используем правильный тип!)
    const toCreate: Prisma.LabelCreateManyInput[] = []

    if (!setHleb.has('Батон нарезной')) {
        toCreate.push({
            productName: 'Батон нарезной',
            weight: '400 г',
            composition: 'мука пшеничная, вода, дрожжи, соль',
            proteins100g: 8, fats100g: 2, carbs100g: 50,
            standard: 'СТБ 1234-2020', shelfLife: '72 часа',
            barcode: '460123456789', barcodeType: 'ean13',
            accountId: hleb.id, folderId: f_got_prod.id,
            createdAt: new Date(), // не обязательно, но валидно
        })
    }
    if (!setHleb.has('Булочка с маком')) {
        toCreate.push({
            productName: 'Булочка с маком',
            weight: '80 г',
            composition: 'мука пшеничная, мак, сахар, масло, вода, дрожжи, соль',
            proteins100g: 7, fats100g: 8, carbs100g: 52,
            standard: 'СТБ 2345-2021', shelfLife: '48 часов',
            barcode: '460987654321', barcodeType: 'ean13',
            accountId: hleb.id, folderId: f_polu.id,
            createdAt: new Date(),
        })
    }

    if (!setRest.has('Стейк из говядины')) {
        toCreate.push({
            productName: 'Стейк из говядины',
            weight: '300 г',
            composition: 'говядина',
            proteins100g: 20, fats100g: 15, carbs100g: 0,
            standard: 'ТУ ресторана', shelfLife: '24 часа',
            barcode: '200000000001', barcodeType: 'ean13',
            accountId: rest.id, folderId: f_menu.id,
            createdAt: new Date(),
        })
    }
    if (!setRest.has('Тирамису')) {
        toCreate.push({
            productName: 'Тирамису',
            weight: '120 г',
            composition: 'сливочный сыр, яйца, печенье савоярди, кофе, какао, сахар',
            proteins100g: 6, fats100g: 16, carbs100g: 27,
            standard: 'ТУ ресторана', shelfLife: '48 часов',
            barcode: '200000000002', barcodeType: 'ean13',
            accountId: rest.id, folderId: f_deserts.id,
            createdAt: new Date(),
        })
    }

    if (toCreate.length > 0) {
        await prisma.label.createMany({
            data: toCreate,
            skipDuplicates: true,
        })
    }

    console.log('✅ Seed done: accounts [hlebzavod, restaurant], folders & labels created/verified')
}

main()
    .catch((e) => { console.error(e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })
