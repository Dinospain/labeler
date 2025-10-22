import { Router, Request, Response } from 'express'
import { prisma } from '../prisma/client'

export const router = Router()

// Глобальный гард: без аккаунта — 400, чтобы не падало на req.account!.id
router.use((req, res, next) => {
  if (!req.account) {
    return res.status(401).json({ error: 'Not authenticated (missing X-Account header)' })
  }
  next()
})
// helpers
const numOrNull = (v: any): number | null =>
  v === undefined || v === null || v === '' ? null : Number(v)

const dateOrNull = (v: any): Date | null => {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

function pickCreateUpdate(body: any) {
  return {
    productName: String(body.productName ?? '').trim(),
    weight: body.weight ?? null,
    composition: body.composition ?? null,
    proteins100g: numOrNull(body.proteins100g),
    fats100g: numOrNull(body.fats100g),
    carbs100g: numOrNull(body.carbs100g),
    standard: body.standard ?? null,
    shelfLife: body.shelfLife ?? null,
    manufacturedAt: dateOrNull(body.manufacturedAt),
    packagedAt: dateOrNull(body.packagedAt),
    expiresAt: dateOrNull(body.expiresAt),
    barcode: body.barcode ?? null,
    barcodeType: 'ean13' as const,
    folderId:
      body.folderId === null || body.folderId === '' ? null :
        body.folderId === undefined ? undefined : Number(body.folderId),
  }
}

// GET /api/labels
router.get('/', async (req: Request, res: Response) => {
  const items = await prisma.label.findMany({
    where: { accountId: req.account!.id },
    orderBy: { updatedAt: 'desc' },
  })
  res.json(items)
})

// GET /api/labels/:id
router.get('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const item = await prisma.label.findFirst({
    where: { id, accountId: req.account!.id },
  })
  if (!item) return res.status(404).json({ error: 'Not found' })
  res.json(item)
})

// POST /api/labels
router.post('/', async (req: Request, res: Response) => {
  const data = pickCreateUpdate(req.body)
  if (!data.productName) {
    return res.status(400).json({ error: 'productName is required' })
  }
  // защита: если folderId указан, он должен принадлежать аккаунту
  if (data.folderId != null) {
    const folder = await prisma.folder.findUnique({ where: { id: data.folderId } })
    if (!folder || folder.accountId !== req.account!.id) {
      return res.status(400).json({ error: 'Invalid folderId for this account' })
    }
  }
  const created = await prisma.label.create({
    data: { ...data, accountId: req.account!.id },
  })
  res.status(201).json(created)
})

// PUT /api/labels/:id
router.put('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const exists = await prisma.label.findUnique({ where: { id } })
  if (!exists || exists.accountId !== req.account!.id) {
    return res.status(404).json({ error: 'Not found' })
  }
  const data = pickCreateUpdate(req.body)
  if (data.folderId != null) {
    const folder = await prisma.folder.findUnique({ where: { id: data.folderId } })
    if (!folder || folder.accountId !== req.account!.id) {
      return res.status(400).json({ error: 'Invalid folderId for this account' })
    }
  }
  const updated = await prisma.label.update({ where: { id }, data })
  res.json(updated)
})

// DELETE /api/labels/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const exists = await prisma.label.findUnique({ where: { id } })
  if (!exists || exists.accountId !== req.account!.id) {
    return res.status(404).json({ error: 'Not found' })
  }
  await prisma.label.delete({ where: { id } })
  res.status(204).end()
})
