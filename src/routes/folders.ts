import { Router } from 'express'
import { prisma } from '../prisma/client'

const router = Router()

// GET /api/folders — список папок + количество этикеток в каждой
router.get('/', async (_req, res) => {
  const folders = await prisma.folder.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { labels: true } } },
  })
  res.json(folders)
})

// POST /api/folders — создать папку
router.post('/', async (req, res) => {
  const name = String(req.body?.name ?? '').trim()
  if (!name) return res.status(400).json({ error: 'name required' })
  const folder = await prisma.folder.create({ data: { name } })
  res.status(201).json(folder)
})

// DELETE /api/folders/:id — удалить папку (этикетки станут без папки)
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid id' })
  await prisma.folder.delete({ where: { id } })
  res.json({ ok: true })
})

export default router
