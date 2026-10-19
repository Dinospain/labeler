import { Router } from 'express'
import type { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../../http/asyncHandler'
import { parseBody, parseIdParam } from '../../http/validate'
import { requireAccount } from '../../middleware/requireAccount'
import { folderSchema } from './folders.schema'
import { foldersService } from './folders.service'

export function foldersRoutes(prisma: PrismaClient) {
  const router = Router()
  const service = foldersService(prisma)
  router.use(requireAccount)

  // список папок текущего аккаунта с количеством этикеток
  router.get('/', asyncHandler(async (req, res) => {
    res.json(await service.list(req.account!.id))
  }))

  router.post('/', asyncHandler(async (req, res) => {
    const { name } = parseBody(folderSchema, req.body)
    res.status(201).json(await service.create(req.account!.id, name))
  }))

  router.put('/:id', asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id)
    const { name } = parseBody(folderSchema, req.body)
    res.json(await service.rename(req.account!.id, id, name))
  }))

  router.delete('/:id', asyncHandler(async (req, res) => {
    await service.remove(req.account!.id, parseIdParam(req.params.id))
    res.status(204).end()
  }))

  return router
}
