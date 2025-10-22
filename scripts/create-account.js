// scripts/create-account.js
const { prisma } = require('../dist/prisma/client') // если ты компилируешь TS в dist
    // Если у тебя исходники на TS без сборки — сделай простую JS-обёртку к node --loader/ts-node
    ; (async () => {
        try {
            const name = process.argv[2]
            const slug = process.argv[3]
            if (!name || !slug) {
                console.log('Usage: node scripts/create-account.js "<Name>" <slug>')
                process.exit(1)
            }
            const acc = await prisma.account.create({
                data: { name, slug },
                select: { id: true, name: true, slug: true },
            })
            console.log('Created account:', acc)
            process.exit(0)
        } catch (e) {
            console.error(e)
            process.exit(1)
        }
    })()
