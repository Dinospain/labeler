// src/middleware/account.ts
import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { PrismaClient } from '@prisma/client'

/** Достаём ссылку на аккаунт: заголовок X-Account > ?account= > cookie X-Account */
export function readAccountRef(req: Pick<Request, 'headers' | 'query'>): string {
  const cookieHeader = req.headers.cookie || ''
  const cookieMap = Object.fromEntries(
    cookieHeader.split(';').map((p) => {
      const [k, ...rest] = p.trim().split('=')
      return [k, rest.join('=')]
    })
  )
  const header = req.headers['x-account']
  return (
    (Array.isArray(header) ? header[0] : header) ||
    (req.query.account as string | undefined) ||
    cookieMap['X-Account'] ||
    ''
  ).toString().trim()
}

export function resolveAccount(prisma: PrismaClient): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const raw = readAccountRef(req)
      if (!raw) return next()

      const where = /^\d+$/.test(raw) ? { id: Number(raw) } : { slug: raw }
      const acc = await prisma.account.findUnique({ where, select: { id: true, slug: true } })
      if (acc) req.account = acc
      next()
    } catch (e) {
      next(e)
    }
  }
}
