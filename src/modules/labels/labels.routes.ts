import { Router } from 'express'
import type { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../../http/asyncHandler'
import { parseBody, parseIdParam } from '../../http/validate'
import { requireAccount } from '../../middleware/requireAccount'
import { createLabelSchema, updateLabelSchema } from './labels.schema'
import { labelsService } from './labels.service'

export function labelsRoutes(prisma: PrismaClient) {
  const router = Router()
  const service = labelsService(prisma)
  router.use(requireAccount)

  router.get('/', asyncHandler(async (req, res) => {
    res.json(await service.list(req.account!.id))
  }))

  router.get('/:id', asyncHandler(async (req, res) => {
    res.json(await service.get(req.account!.id, parseIdParam(req.params.id)))
  }))

  router.post('/', asyncHandler(async (req, res) => {
    res.status(201).json(await service.create(req.account!.id, parseBody(createLabelSchema, req.body)))
  }))

  router.put('/:id', asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id)
    res.json(await service.update(req.account!.id, id, parseBody(updateLabelSchema, req.body)))
  }))

  router.delete('/:id', asyncHandler(async (req, res) => {
    await service.remove(req.account!.id, parseIdParam(req.params.id))
    res.status(204).end()
  }))

  return router
}
