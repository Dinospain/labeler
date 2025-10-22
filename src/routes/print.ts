import { Router, Request, Response } from 'express'
import { prisma } from '../prisma/client'
import { renderLabelsToPdf } from '../pdf/render'

export const router = Router()
router.use((req, res, next) => {
  if (!req.account) {
    return res.status(401).json({ error: 'Not authenticated (missing X-Account header)' })
  }
  next()
})

// GET /api/print?ids=1,2&size=58x40   |  если ids нет — печатаем все этикетки аккаунта
router.get('/', async (req: Request, res: Response) => {
  const size = (req.query.size as string | undefined) ?? '100x70'

  const rawIds = (req.query.ids as string | undefined)
    ?.split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n))

  let labels: { id: number }[]
  if (rawIds && rawIds.length) {
    // выберем только те id, что принадлежат этому аккаунту
    labels = await prisma.label.findMany({
      where: { id: { in: rawIds }, accountId: req.account!.id },
      select: { id: true },
      orderBy: { id: 'asc' },
    })
    if (!labels.length) {
      return res.status(404).json({ error: 'No labels to print in this account' })
    }
  } else {
    labels = await prisma.label.findMany({
      where: { accountId: req.account!.id },
      select: { id: true },
      orderBy: { id: 'asc' },
    })
    if (!labels.length) {
      return res.status(404).json({ error: 'No labels in this account' })
    }
  }

  const pdf = await renderLabelsToPdf({
    size,
    ids: labels.map((l) => l.id),
  })

  res.setHeader('Content-Type', 'application/pdf')
  res.send(pdf)
})
