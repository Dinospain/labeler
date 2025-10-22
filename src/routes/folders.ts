import { Router, Request, Response } from 'express'
import { prisma } from '../prisma/client'

export const router = Router()
router.use((req, res, next) => {
  if (!req.account) {
    return res.status(401).json({ error: 'Not authenticated (missing X-Account header)' })
  }
  next()
})

// GET /api/folders — список папок текущего аккаунта с количеством этикеток
router.get('/', async (req: Request, res: Response) => {
  const folders = await prisma.folder.findMany({
    where: { accountId: req.account!.id },
    orderBy: { name: 'asc' },
    include: { _count: { select: { labels: true } } },
  })
  res.json(folders)
})

// POST /api/folders — создать папку
router.post('/', async (req: Request, res: Response) => {
  const name = String(req.body?.name ?? '').trim()
  if (!name) return res.status(400).json({ error: 'name is required' })
  const created = await prisma.folder.create({
    data: { name, accountId: req.account!.id },
  })
  res.status(201).json(created)
})

// PUT /api/folders/:id — переименовать (опционально)
router.put('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const name = String(req.body?.name ?? '').trim()
  if (!name) return res.status(400).json({ error: 'name is required' })

  const exists = await prisma.folder.findUnique({ where: { id } })
  if (!exists || exists.accountId !== req.account!.id) {
    return res.status(404).json({ error: 'Not found' })
  }
  const updated = await prisma.folder.update({
    where: { id },
    data: { name },
  })
  res.json(updated)
})

// DELETE /api/folders/:id — удалить папку
router.delete('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const exists = await prisma.folder.findUnique({ where: { id } })
  if (!exists || exists.accountId !== req.account!.id) {
    return res.status(404).json({ error: 'Not found' })
  }
  await prisma.folder.delete({ where: { id } })
  res.status(204).end()
})
