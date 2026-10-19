import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../prisma/client'

const router = Router()

// Все запросы ограничены аккаунтом (tenant) из req.account
router.use((req, res, next) => {
  if (!req.account) return res.status(401).json({ error: 'Account required' })
  next()
})

router.get('/', async (req, res) => {
  const items = await prisma.template.findMany({
    where: { accountId: req.account!.id },
    orderBy: [{ isCurrent: 'desc' }, { updatedAt: 'desc' }]
  })
  res.json(items)
})

router.post('/', async (req, res) => {
  const schema = z.object({
    name: z.string().min(1),
    html: z.string().min(1),
    isCurrent: z.boolean().optional()
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json(parsed.error)

  const accountId = req.account!.id
  if (parsed.data.isCurrent) {
    await prisma.template.updateMany({ where: { accountId }, data: { isCurrent: false } })
  }
  const created = await prisma.template.create({ data: { ...parsed.data, accountId } })
  res.status(201).json(created)
})

router.put('/:id/make-current', async (req, res) => {
  const id = Number(req.params.id)
  const accountId = req.account!.id
  const existing = await prisma.template.findFirst({ where: { id, accountId } })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  await prisma.template.updateMany({ where: { accountId }, data: { isCurrent: false } })
  const updated = await prisma.template.update({ where: { id }, data: { isCurrent: true } })
  res.json(updated)
})

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const accountId = req.account!.id
  const schema = z.object({ name: z.string().optional(), html: z.string().optional(), isCurrent: z.boolean().optional() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json(parsed.error)

  const existing = await prisma.template.findFirst({ where: { id, accountId } })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const data = parsed.data
  if (data.isCurrent === true) {
    await prisma.template.updateMany({ where: { accountId }, data: { isCurrent: false } })
  }
  const updated = await prisma.template.update({ where: { id }, data })
  res.json(updated)
})

export default router
