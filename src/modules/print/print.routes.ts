import { Router } from 'express'
import type { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../../http/asyncHandler'
import { notFound } from '../../http/errors'
import { requireAccount } from '../../middleware/requireAccount'
import { labelsService } from '../labels/labels.service'

export type PdfRenderer = (opts: { ids: number[]; size: string }) => Promise<Buffer | Uint8Array>

export function printRoutes(prisma: PrismaClient, renderPdf: PdfRenderer) {
  const router = Router()
  const labels = labelsService(prisma)
  router.use(requireAccount)

  // GET /api/print?ids=1,2&size=58x40 — без ids печатаем все этикетки аккаунта
  router.get('/', asyncHandler(async (req, res) => {
    const size = (req.query.size as string | undefined) ?? '100x70'
    const rawIds = (req.query.ids as string | undefined)
      ?.split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n))

    // только те id, что принадлежат этому аккаунту
    const ids = await labels.idsFor(req.account!.id, rawIds)
    if (!ids.length) {
      throw notFound(rawIds?.length ? 'No labels to print in this account' : 'No labels in this account')
    }

    const pdf = await renderPdf({ size, ids })
    res.setHeader('Content-Type', 'application/pdf')
    res.send(Buffer.from(pdf))
  }))

  return router
}
