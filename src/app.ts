import fs from 'fs'
import path from 'path'
import cors from 'cors'
import express from 'express'
import type { PrismaClient } from '@prisma/client'
import { apiNotFound, errorHandler } from './http/errors'
import { resolveAccount } from './middleware/account'
import { authRoutes } from './modules/auth/auth.routes'
import { foldersRoutes } from './modules/folders/folders.routes'
import { labelsRoutes } from './modules/labels/labels.routes'
import { printRoutes, type PdfRenderer } from './modules/print/print.routes'
import { templatesRoutes } from './modules/templates/templates.routes'

export type AppDeps = {
  prisma: PrismaClient
  pdfRenderer: PdfRenderer
  /** Каталог собранного фронта; если не существует — статика не раздаётся */
  clientDist?: string
}

export function createApp({ prisma, pdfRenderer, clientDist }: AppDeps) {
  const app = express()

  app.use(cors({ origin: true, credentials: true }))
  app.use(express.json({ limit: '2mb' }))
  app.use(resolveAccount(prisma))

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })
  // auth без обязательного аккаунта (список отделов / "логин")
  app.use('/api/auth', authRoutes(prisma))
  app.use('/api/labels', labelsRoutes(prisma))
  app.use('/api/folders', foldersRoutes(prisma))
  app.use('/api/templates', templatesRoutes(prisma))
  app.use('/api/print', printRoutes(prisma, pdfRenderer))
  app.use('/api', apiNotFound)

  // статика фронта + SPA-фоллбек (кроме /api)
  if (clientDist && fs.existsSync(clientDist)) {
    app.use(express.static(clientDist))
    app.get(/^(?!\/api(\/|$)).*/, (_req, res) => res.sendFile(path.join(clientDist, 'index.html')))
  }

  app.use(errorHandler)
  return app
}
