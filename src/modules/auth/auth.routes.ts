import { Router } from 'express'
import type { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { asyncHandler } from '../../http/asyncHandler'
import { badRequest, notFound } from '../../http/errors'

const loginSchema = z.object({ slug: z.string().trim().min(1) })

export function authRoutes(prisma: PrismaClient) {
  const router = Router()

  // Список отделов/предприятий
  router.get('/accounts', asyncHandler(async (_req, res) => {
    res.json(await prisma.account.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    }))
  }))

  // «Логин» по slug (без паролей)
  router.post('/login', asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body ?? {})
    if (!parsed.success) throw badRequest('slug is required')
    const account = await prisma.account.findUnique({
      where: { slug: parsed.data.slug },
      select: { id: true, name: true, slug: true },
    })
    if (!account) throw notFound('Account not found')
    res.json({ account })
  }))

  return router
}
