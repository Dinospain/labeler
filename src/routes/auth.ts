import { Router, Request, Response } from 'express'
import { prisma } from '../prisma/client'

export const router = Router()

// Список отделов/предприятий
router.get('/accounts', async (_req: Request, res: Response) => {
    const accounts = await prisma.account.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' },
    })
    res.json(accounts)
})

// «Логин» по slug (без паролей)
router.post('/login', async (req: Request, res: Response) => {
    const slug = String(req.body?.slug ?? '').trim()
    if (!slug) return res.status(400).json({ error: 'slug is required' })
    const acc = await prisma.account.findUnique({
        where: { slug },
        select: { id: true, name: true, slug: true },
    })
    if (!acc) return res.status(404).json({ error: 'Account not found' })
    res.json({ account: acc })
})

